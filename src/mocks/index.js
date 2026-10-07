import { registerMocks } from "@/shared/api/mocks";
import * as seed from "./data";

/*
 * Моки основного API (VITE_USE_MOCKS=true). Данные живут в памяти до перезагрузки страницы.
 * Вход: любой логин и пароль. Логин, содержащий «user», входит с ролью Basic, остальные — Admin.
 */

const db = structuredClone({ ...seed });
const nextId = (list) => Math.max(0, ...list.map((x) => Number(x.id))) + 1;
const fail = (status, message) => {
  throw { status, data: { message } };
};

/** Постраничный ответ в формате бэкенда */
const page = (list, params = {}) => {
  const number = Number(params.PageNumber ?? params.pageNumber ?? 1);
  const size = Number(params.PageSize ?? params.pageSize ?? 10);
  return { data: list.slice((number - 1) * size, number * size), totalRecords: list.length, succeeded: true };
};

/** CRUD для коллекции */
const crud = (resource, key, extra = (x) => x) => ({
  [`GET /${resource}`]: ({ params }) => page(db[key], params),
  [`GET /${resource}/:id`]: ({ id }) => ({ data: db[key].find((x) => String(x.id) === id) ?? fail(404, "Not found") }),
  [`POST /${resource}`]: ({ body }) => {
    const item = extra({ ...body, id: nextId(db[key]) });
    db[key].push(item);
    return { data: item };
  },
  [`PUT /${resource}/:id`]: ({ id, body }) => {
    const i = db[key].findIndex((x) => String(x.id) === id);
    if (i < 0) fail(404, "Not found");
    db[key][i] = extra({ ...db[key][i], ...body, id: Number(id) });
    return { data: db[key][i] };
  },
  [`DELETE /${resource}/:id`]: ({ id }) => {
    db[key] = db[key].filter((x) => String(x.id) !== id);
    return { succeeded: true };
  },
});

/** Материал базы знаний приходит как FormData с полями Title, Content, FolderId… */
const announcementFromForm = (body, prev = {}) => ({
  ...prev,
  title: body.Title ?? prev.title,
  content: body.Content ?? prev.content,
  folderId: body.FolderId != null ? Number(body.FolderId) || null : prev.folderId,
  subDepartmentId: body.SubDepartmentId != null ? Number(body.SubDepartmentId) || null : prev.subDepartmentId,
  employeeId: body.EmployeeId != null ? Number(body.EmployeeId) || null : prev.employeeId,
  profileImagePath: body.ProfileImage?.name ? `/uploads/${body.ProfileImage.name}` : prev.profileImagePath,
});

const withOptionIds = (q) => ({
  ...q,
  options: (q.options ?? []).map((o, i) => ({ ...o, id: o.id ?? Number(q.id) * 100 + i + 1 })),
});

registerMocks({
  "POST /Account/login": ({ body }) => {
    if (body.password === "wrong") fail(401, "Invalid credentials");
    const isBasic = body.userName.toLowerCase().includes("user");
    return {
      data: {
        jwToken: "mock-token",
        userName: body.userName,
        firstName: isBasic ? "Сотрудник" : "Иван",
        lastName: isBasic ? "Тестовый" : "Петров",
        email: `${body.userName}@activbank.tj`,
        roles: isBasic ? ["Basic"] : ["Admin"],
      },
    };
  },
  "POST /Account/register": () => ({ succeeded: true }),
  "GET /User": ({ params }) => page(db.users, params),

  ...crud("Department", "departments"),
  ...crud("SubDepartment", "subdepartments"),
  ...crud("Position", "positions"),
  ...crud("Employee", "employees"),

  "GET /Folder": ({ params }) => ({
    data: db.folders
      .filter((f) => params.folderType == null || String(f.folderType) === String(params.folderType))
      .map((f) => ({ ...f, announcements: db.announcements.filter((a) => a.folderId === f.id) })),
  }),
  "POST /Folder": ({ body }) => {
    const folder = { ...body, id: nextId(db.folders) };
    db.folders.push(folder);
    return { data: folder };
  },
  "PUT /Folder/:id": ({ id, body }) => {
    const folder = db.folders.find((f) => String(f.id) === id);
    Object.assign(folder, body);
    return { data: folder };
  },
  "DELETE /Folder/:id": ({ id }) => {
    db.folders = db.folders.filter((f) => String(f.id) !== id);
    return { succeeded: true };
  },

  "GET /Announcement": () => ({ data: db.announcements }),
  "POST /Announcement": ({ body }) => {
    const item = { ...announcementFromForm(body), id: nextId(db.announcements), createdAt: new Date().toISOString() };
    db.announcements.push(item);
    return { data: item };
  },
  "PUT /Announcement/:id": ({ id, body }) => {
    const i = db.announcements.findIndex((a) => String(a.id) === id);
    db.announcements[i] = announcementFromForm(body, db.announcements[i]);
    return { data: db.announcements[i] };
  },
  "DELETE /Announcement/:id": ({ id }) => {
    db.announcements = db.announcements.filter((a) => String(a.id) !== id);
    return { succeeded: true };
  },

  ...crud("Question", "questions", withOptionIds),
  ...crud("Answer", "answers"),

  "GET /Test": ({ params }) =>
    page(
      db.tests.map((t) => ({
        ...t,
        questions: t.questions.map((tq) => db.questions.find((q) => q.id === tq.questionId) ?? tq),
      })),
      params,
    ),
  "POST /Test": ({ body }) => {
    const test = { ...body, id: nextId(db.tests), createdAt: new Date().toISOString() };
    db.tests.push(test);
    return { data: test };
  },
  "PUT /Test/:id": ({ id, body }) => {
    const i = db.tests.findIndex((t) => String(t.id) === id);
    db.tests[i] = { ...db.tests[i], ...body };
    return { data: db.tests[i] };
  },
  "DELETE /Test/:id": ({ id }) => {
    db.tests = db.tests.filter((t) => String(t.id) !== id);
    return { succeeded: true };
  },

  "GET /TestSession": ({ params }) => page(db.sessions, params),
  "POST /TestSession/start": ({ body }) => {
    const test = db.tests.find((t) => t.id === body.testId);
    const session = {
      id: nextId(db.sessions),
      testId: body.testId,
      employeeId: body.employeeId,
      status: "InProgress",
      startedAt: new Date().toISOString(),
      answers: [],
      totalQuestionsCount: test?.questions.length ?? 0,
    };
    db.sessions.push(session);
    return { data: session };
  },
  "POST /TestSession/answer": ({ body }) => {
    const session = db.sessions.find((s) => s.id === body.sessionId);
    const question = db.questions.find((q) => q.id === body.questionId);
    const option = question?.options.find((o) => o.id === body.optionId);
    const isCorrect =
      question?.type === 1 ? Boolean(option?.isCorrect) : question?.type === 2 ? Boolean(body.textAnswer) : null;
    session.answers = [...session.answers.filter((a) => a.questionId !== body.questionId), { ...body, isCorrect }];
    return { data: session };
  },
  "POST /TestSession/:id/finish": ({ id }) => {
    const session = db.sessions.find((s) => String(s.id) === id);
    const scored = session.answers.filter((a) => a.isCorrect !== null);
    session.correctAnswersCount = scored.filter((a) => a.isCorrect).length;
    session.score = scored.length ? Math.round((session.correctAnswersCount / session.totalQuestionsCount) * 100) : 0;
    session.status = "Completed";
    session.finishedAt = new Date().toISOString();
    session.durationMinutes = (new Date(session.finishedAt) - new Date(session.startedAt)) / 60000;
    return { data: session };
  },

  ...crud("TestAssignment", "assignments"),
});
