/*
 * Модель тестирования. Бэкенд отдаёт типы и статусы то числами, то строками,
 * а тексты — в двух языках (contentRu/contentTj, textRu/textTj, titleRu/titleTj).
 * Здесь всё приводится к одному виду.
 */

export const QUESTION_TYPE = { CHOICE: 1, OPEN: 2, RATING: 3 };

/** Ключи переводов common:questionType.* */
export const QUESTION_TYPE_KEY = { 1: "choice", 2: "open", 3: "rating" };

/** 1 | "MultipleChoice" | "Test" → 1;  2 | "OpenEnded" | "Manual" → 2;  3 | "Rating" → 3 */
export function questionType(type) {
  if (type === 2 || type === 3) return type;
  const s = String(type ?? "").toLowerCase();
  if (s === "2" || s.startsWith("open") || s.startsWith("man")) return QUESTION_TYPE.OPEN;
  if (s === "3" || s.startsWith("rat") || s.startsWith("score")) return QUESTION_TYPE.RATING;
  return QUESTION_TYPE.CHOICE;
}

/**
 * Тип вопроса для отправки на бэкенд — числом.
 * Прежняя система слала то "MultipleChoice", то 1; число .NET принимает всегда,
 * строку — только при включённом JsonStringEnumConverter.
 */
export const apiQuestionType = (type) => questionType(type);

/** Текст на нужном языке с запасным вариантом: field="content" → contentRu / contentTj / content */
export function localized(obj, field, lang) {
  if (!obj) return "";
  const ru = obj[`${field}Ru`] ?? obj[`${field[0].toUpperCase()}${field.slice(1)}Ru`];
  const tj = obj[`${field}Tj`] ?? obj[`${field[0].toUpperCase()}${field.slice(1)}Tj`];
  const plain = obj[field];
  const value = lang === "tj" ? tj || plain || ru : ru || plain || tj;
  return (value ?? "").trim();
}

export const questionText = (q, lang) => localized(q, "content", lang) || "—";
export const optionText = (o, lang) => localized(o, "text", lang) || "—";
export const testTitle = (t, lang) => localized(t, "title", lang) || `#${t?.id ?? ""}`;
export const testDescription = (t, lang) => localized(t, "description", lang);

/** Приводит вопрос к одному виду: id, числовой type, options с textRu/textTj/isCorrect */
export function normalizeQuestion(q) {
  if (!q) return q;
  const options = q.options ?? q.Options ?? q.$values ?? [];
  return {
    ...q,
    id: q.id ?? q.Id ?? q.questionId ?? q.QuestionId,
    type: questionType(q.type ?? q.Type),
    contentRu: q.contentRu ?? q.ContentRu ?? q.content ?? "",
    contentTj: q.contentTj ?? q.ContentTj ?? q.content ?? "",
    options: options.map((o) => ({
      ...o,
      id: o.id ?? o.Id,
      textRu: o.textRu ?? o.TextRu ?? o.text ?? "",
      textTj: o.textTj ?? o.TextTj ?? o.text ?? "",
      isCorrect: Boolean(o.isCorrect ?? o.IsCorrect),
    })),
  };
}

/** Эталонный ответ: правильный вариант для теста, первый вариант для открытого вопроса */
export function correctAnswer(q) {
  const type = questionType(q?.type);
  if (type === QUESTION_TYPE.CHOICE) return q.options?.find((o) => o.isCorrect) ?? null;
  if (type === QUESTION_TYPE.OPEN) return q.options?.[0] ?? null;
  return null;
}

// ─── Тесты и опросы ───────────────────────────────────────────────────────

export const SURVEY_TEST_TYPE = "Quiz";
export const REGULAR_TEST_TYPE = 1;

/** Опрос — это тест с testType "Quiz" (или числовым кодом ≥ 2) */
export function isSurvey(test) {
  const v = test?.testType ?? test?.test_type;
  if (v == null || v === "") return false;
  const s = String(v).trim().toLowerCase();
  if (["quiz", "survey", "опрос", "questionnaire"].includes(s)) return true;
  const n = Number(s);
  return !Number.isNaN(n) && n >= 2;
}

/** Обычный тест (не опрос и не черновик с testType 0) */
export const isRegularTest = (test) => !isSurvey(test) && String(test?.testType) !== "0";

/** Вопросы теста в формате API: порядок, тип, эталон, варианты */
export function buildTestQuestions(questionIds, questions) {
  return questionIds.map((questionId, index) => {
    const q = questions.find((x) => String(x.id) === String(questionId));
    const type = questionType(q?.type);
    const correct = q ? correctAnswer(q) : null;
    return {
      questionId: Number.isNaN(Number(questionId)) ? questionId : Number(questionId),
      order: index + 1,
      type: apiQuestionType(type),
      correctAnswer: correct ? { textRu: correct.textRu, textTj: correct.textTj } : null,
      options: (q?.options ?? []).map((o) => ({ textRu: o.textRu, textTj: o.textTj, isCorrect: Boolean(o.isCorrect) })),
    };
  });
}

/** id вопросов, уже входящих в другие тесты (вопрос может быть только в одном тесте) */
export function usedQuestionIds(tests, exceptTestId) {
  const ids = new Set();
  for (const t of tests) {
    if (exceptTestId != null && String(t.id) === String(exceptTestId)) continue;
    for (const q of t.questions ?? []) ids.add(String(q.id ?? q.questionId));
  }
  return ids;
}

// ─── Сессии ───────────────────────────────────────────────────────────────

export const SESSION_STATUS = { NOT_STARTED: 0, IN_PROGRESS: 1, COMPLETED: 2, CANCELLED: 3 };

/** Статус сессии числом: строки "InProgress", "completed" и т.п. тоже понимаются */
export function sessionStatus(status) {
  const s = String(status ?? "")
    .toLowerCase()
    .trim();
  if (["1", "inprogress", "in_progress", "pending", "active"].includes(s)) return SESSION_STATUS.IN_PROGRESS;
  if (["2", "completed", "finished", "done", "passed"].includes(s)) return SESSION_STATUS.COMPLETED;
  if (["0", "notstarted", "not_started", "new", "created"].includes(s)) return SESSION_STATUS.NOT_STARTED;
  if (["3", "cancelled", "canceled", "expired"].includes(s)) return SESSION_STATUS.CANCELLED;
  return null;
}

/** Не больше двух завершённых попыток на тест */
export const MAX_ATTEMPTS = 2;

export function attemptInfo(sessions, employeeId, testId) {
  const completed = sessions.filter(
    (s) =>
      String(s.employeeId) === String(employeeId) &&
      String(s.testId) === String(testId) &&
      sessionStatus(s.status) === SESSION_STATUS.COMPLETED,
  ).length;
  return { completed, remaining: Math.max(0, MAX_ATTEMPTS - completed), canRetake: completed < MAX_ATTEMPTS };
}

/** Текст ответа сотрудника в сессии */
export function sessionAnswerText(answer, question, lang) {
  const type = questionType(question?.type);
  if (answer.optionId != null && type === QUESTION_TYPE.RATING) return `${answer.optionId}/10`;
  if (answer.optionId != null && question?.options) {
    const option = question.options.find((o) => String(o.id) === String(answer.optionId));
    if (option) return optionText(option, lang);
  }
  return answer.textAnswer || "—";
}
