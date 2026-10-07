/** Начальные данные моков (src/mocks/index.js). Имена и структура — вымышленные. */

export const departments = [
  { id: 1, name: "Управление розничного бизнеса" },
  { id: 2, name: "Управление корпоративного бизнеса" },
  { id: 3, name: "Управление по работе с персоналом" },
];

export const subdepartments = [
  { id: 1, name: "Отдел кредитования физических лиц", departmentId: 1 },
  { id: 2, name: "Отдел карточных продуктов", departmentId: 1 },
  { id: 3, name: "Отдел обслуживания юрлиц", departmentId: 2 },
  { id: 4, name: "Отдел обучения", departmentId: 3 },
];

export const positions = [
  { id: 1, title: "Кредитный специалист" },
  { id: 2, title: "Операционист" },
  { id: 3, title: "Начальник отдела" },
  { id: 4, title: "HR-менеджер" },
];

export const employees = [
  {
    id: 1,
    firstName: "Фарход",
    lastName: "Рахимов",
    email: "f.rahimov@activbank.tj",
    phone: "927001122",
    departmentId: 1,
    subDepartmentId: 1,
    positionId: 1,
  },
  {
    id: 2,
    firstName: "Мадина",
    lastName: "Саидова",
    email: "m.saidova@activbank.tj",
    phone: "927003344",
    departmentId: 1,
    subDepartmentId: 2,
    positionId: 2,
  },
  {
    id: 3,
    firstName: "Рустам",
    lastName: "Назаров",
    email: "r.nazarov@activbank.tj",
    phone: "927005566",
    departmentId: 2,
    subDepartmentId: 3,
    positionId: 3,
  },
  {
    id: 4,
    firstName: "Нигина",
    lastName: "Каримова",
    email: "n.karimova@activbank.tj",
    phone: "927007788",
    departmentId: 3,
    subDepartmentId: 4,
    positionId: 4,
  },
  {
    id: 5,
    firstName: "Далер",
    lastName: "Юсупов",
    email: "d.yusupov@activbank.tj",
    phone: "927009900",
    departmentId: 1,
    subDepartmentId: 1,
    positionId: 2,
  },
];

export const users = [
  {
    id: 1,
    firstName: "Иван",
    lastName: "Петров",
    email: "i.petrov@activbank.tj",
    roles: ["Admin"],
    lastLogin: new Date().toISOString(),
  },
  {
    id: 2,
    firstName: "Мадина",
    lastName: "Саидова",
    email: "m.saidova@activbank.tj",
    roles: ["Basic"],
    lastLogin: new Date(Date.now() - 3600e3).toISOString(),
  },
];

export const folders = [
  { id: 1, name: "Вводный курс", folderType: 0 },
  { id: 2, name: "Кредитные продукты", folderType: 0 },
  { id: 3, name: "Регламенты", folderType: 1 },
  { id: 4, name: "Шаблоны документов", folderType: 1 },
];

export const announcements = [
  {
    id: 1,
    title: "Знакомство с банком",
    content: "Видео для новых сотрудников: история, ценности и структура банка.",
    folderId: 1,
    createdAt: "2026-09-01T09:00:00",
    employeeId: 4,
    subDepartmentId: 4,
  },
  {
    id: 2,
    title: "Порядок выдачи потребительского кредита",
    content: "Пошаговый разбор процесса от заявки до выдачи.",
    folderId: 2,
    createdAt: "2026-09-12T11:30:00",
    employeeId: 3,
    subDepartmentId: 1,
  },
  {
    id: 3,
    title: "Регламент обслуживания клиентов",
    content: "Стандарты общения с клиентами в отделениях.",
    folderId: 3,
    createdAt: "2026-08-20T10:00:00",
    employeeId: 4,
    subDepartmentId: 4,
  },
  {
    id: 4,
    title: "Шаблон служебной записки",
    content: "Актуальная форма служебной записки.",
    folderId: 4,
    createdAt: "2026-07-05T15:00:00",
    employeeId: 4,
    subDepartmentId: 4,
  },
];

export const questions = [
  {
    id: 1,
    type: 1,
    contentRu: "Какой документ удостоверяет личность клиента?",
    contentTj: "Кадом ҳуҷҷат шахсияти муштариро тасдиқ мекунад?",
    options: [
      { id: 101, textRu: "Паспорт", textTj: "Шиноснома", isCorrect: true },
      { id: 102, textRu: "Водительские права", textTj: "Шаҳодатномаи ронандагӣ", isCorrect: false },
      { id: 103, textRu: "Студенческий билет", textTj: "Билети донишҷӯӣ", isCorrect: false },
    ],
  },
  {
    id: 2,
    type: 1,
    contentRu: "Сколько дней действует пароль от рабочей учётной записи?",
    contentTj: "Рамзи ҳисоби корӣ чанд рӯз эътибор дорад?",
    options: [
      { id: 201, textRu: "30", textTj: "30", isCorrect: false },
      { id: 202, textRu: "90", textTj: "90", isCorrect: true },
    ],
  },
  {
    id: 3,
    type: 2,
    contentRu: "Назовите национальную валюту Таджикистана",
    contentTj: "Пули миллии Тоҷикистонро номбар кунед",
    options: [{ id: 301, textRu: "Сомони", textTj: "Сомонӣ", isCorrect: true }],
  },
  {
    id: 4,
    type: 3,
    contentRu: "Оцените, насколько понятен вводный курс",
    contentTj: "Курси муқаддимавӣ то чӣ андоза фаҳмо аст?",
    options: [],
  },
  {
    id: 5,
    type: 3,
    contentRu: "Насколько вы довольны условиями работы?",
    contentTj: "Аз шароити корӣ то чӣ андоза қаноатманд ҳастед?",
    options: [],
  },
];

export const tests = [
  {
    id: 1,
    titleRu: "Основы обслуживания клиентов",
    titleTj: "Асосҳои хизматрасонӣ ба муштариён",
    descriptionRu: "Проверка знаний для операционистов",
    descriptionTj: "Санҷиши дониш барои операторон",
    testType: 1,
    createdAt: "2026-09-15T09:00:00",
    questions: [{ questionId: 1 }, { questionId: 2 }, { questionId: 3 }],
  },
  {
    id: 2,
    titleRu: "Обратная связь по адаптации",
    titleTj: "Фикру мулоҳиза оид ба мутобиқшавӣ",
    descriptionRu: "Анонимный опрос новых сотрудников",
    descriptionTj: "Пурсиши кормандони нав",
    testType: "Quiz",
    createdAt: "2026-09-20T09:00:00",
    questions: [{ questionId: 4 }, { questionId: 5 }],
  },
];

export const sessions = [
  {
    id: 1,
    testId: 1,
    employeeId: 1,
    status: "Completed",
    score: 67,
    correctAnswersCount: 2,
    totalQuestionsCount: 3,
    startedAt: "2026-10-01T10:00:00",
    finishedAt: "2026-10-01T10:06:30",
    durationMinutes: 6.5,
    answers: [
      { questionId: 1, optionId: 101, isCorrect: true },
      { questionId: 2, optionId: 201, isCorrect: false },
      { questionId: 3, textAnswer: "Сомони", isCorrect: true },
    ],
  },
  {
    id: 2,
    testId: 1,
    employeeId: 2,
    status: "Completed",
    score: 100,
    correctAnswersCount: 3,
    totalQuestionsCount: 3,
    startedAt: "2026-10-02T14:00:00",
    finishedAt: "2026-10-02T14:04:10",
    durationMinutes: 4.2,
    answers: [
      { questionId: 1, optionId: 101, isCorrect: true },
      { questionId: 2, optionId: 202, isCorrect: true },
      { questionId: 3, textAnswer: "сомони", isCorrect: true },
    ],
  },
];

export const assignments = [
  { id: 1, testId: 1, employeeId: 1, subDepartmentId: 1 },
  { id: 2, testId: 1, employeeId: 2, subDepartmentId: 2 },
];

export const answers = [];
