/**
 * Домен testing: регистрация страниц тестов, опросов, результатов, прохождения и банка вопросов.
 */
import { lazy } from "react";
import { BarChart3, ClipboardCheck, ClipboardList, ListChecks, MessageSquareText, Trophy } from "lucide-react";

/**
 * Тестирование: тесты, опросы, прохождение и результаты.
 * Тесты и опросы — одна сущность на бэкенде (опрос = тест с testType "Quiz"),
 * поэтому у них общие редактор, выбор вопросов и диалог запуска.
 */
export default [
  {
    id: "tests",
    path: "/test",
    icon: ClipboardCheck,
    section: "testing",
    order: 10,
    titleKey: "tests.title",
    page: lazy(() => import("./pages/TestsPage/TestsPage")),
  },
  {
    id: "surveys",
    path: "/surveys",
    icon: ClipboardList,
    section: "testing",
    order: 20,
    titleKey: "surveys.title",
    page: lazy(() => import("./pages/SurveysPage/SurveysPage")),
  },
  {
    id: "test-results",
    path: "/test-taking",
    icon: Trophy,
    section: "testing",
    order: 30,
    roles: ["admin"],
    titleKey: "results.title",
    page: lazy(() => import("./pages/TestResultsPage/TestResultsPage")),
  },
  {
    id: "survey-results",
    path: "/survey-results",
    icon: BarChart3,
    section: "testing",
    order: 40,
    roles: ["admin"],
    titleKey: "surveyResults.title",
    page: lazy(() => import("./pages/SurveyResultsPage/SurveyResultsPage")),
  },
  {
    // Прохождение теста — на весь экран, без меню
    id: "test-run",
    path: "/test/run",
    section: null,
    layout: "blank",
    titleKey: "run.title",
    page: lazy(() => import("./pages/TestRunPage/TestRunPage")),
  },
  {
    // Банк вопросов и ручной ввод ответов: в меню не выводятся, как и в прежней системе
    id: "questions",
    path: "/question",
    icon: ListChecks,
    section: null,
    roles: ["admin"],
    titleKey: "questions.title",
    page: lazy(() => import("./pages/QuestionsPage/QuestionsPage")),
  },
  {
    id: "answers",
    path: "/reply",
    icon: MessageSquareText,
    section: null,
    roles: ["admin"],
    titleKey: "answers.title",
    page: lazy(() => import("./pages/AnswersPage/AnswersPage")),
  },
];
