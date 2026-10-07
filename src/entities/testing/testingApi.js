import { baseApi } from "@/shared/api/baseApi";
import { unwrapItem, unwrapList } from "@/shared/api/normalize";
import { normalizeQuestion } from "./model";

/**
 * Тестирование: вопросы, тесты и опросы (это тоже тесты, testType = "Quiz"),
 * сессии прохождения и назначения. Используется фичами tests, surveys, questions.
 */
export const testingApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["Question", "Answer", "Test", "Session", "Assignment"] })
  .injectEndpoints({
    endpoints: (build) => ({
      // ─── Вопросы ───
      getQuestions: build.query({
        query: ({ pageNumber = 1, pageSize = 2000, type } = {}) => ({
          url: "/Question",
          params: { PageNumber: pageNumber, PageSize: pageSize, ...(type ? { Type: type } : {}) },
        }),
        transformResponse: (res) => {
          const { items, total } = unwrapList(res);
          return { items: items.map(normalizeQuestion), total };
        },
        providesTags: ["Question"],
      }),
      createQuestion: build.mutation({
        query: (body) => ({ url: "/Question", method: "POST", body }),
        transformResponse: unwrapItem,
        invalidatesTags: ["Question"],
      }),
      updateQuestion: build.mutation({
        query: ({ id, ...body }) => ({ url: `/Question/${id}`, method: "PUT", body }),
        invalidatesTags: ["Question", "Test"],
      }),
      deleteQuestion: build.mutation({
        query: (id) => ({ url: `/Question/${id}`, method: "DELETE" }),
        invalidatesTags: ["Question", "Test"],
      }),

      // ─── Ответы (ручной ввод результатов, страница /reply) ───
      getAnswers: build.query({
        query: () => ({ url: "/Answer", params: { pageNumber: 1, pageSize: 1000 } }),
        transformResponse: (res) => unwrapList(res).items,
        providesTags: ["Answer"],
      }),
      createAnswer: build.mutation({
        query: (body) => ({ url: "/Answer", method: "POST", body }),
        invalidatesTags: ["Answer"],
      }),
      deleteAnswer: build.mutation({
        query: (id) => ({ url: `/Answer/${id}`, method: "DELETE" }),
        invalidatesTags: ["Answer"],
      }),

      // ─── Тесты и опросы ───
      getTests: build.query({
        query: () => ({ url: "/Test", params: { pageNumber: 1, pageSize: 1000 } }),
        transformResponse: (res) =>
          unwrapList(res).items.map((t) => ({ ...t, questions: (t.questions ?? []).map(normalizeQuestion) })),
        providesTags: ["Test"],
      }),
      createTest: build.mutation({
        query: (body) => ({ url: "/Test", method: "POST", body }),
        transformResponse: unwrapItem,
        invalidatesTags: ["Test"],
      }),
      updateTest: build.mutation({
        query: ({ id, ...body }) => ({ url: `/Test/${id}`, method: "PUT", body }),
        invalidatesTags: ["Test"],
      }),
      deleteTest: build.mutation({
        query: (id) => ({ url: `/Test/${id}`, method: "DELETE" }),
        invalidatesTags: ["Test"],
      }),

      // ─── Сессии прохождения ───
      getSessions: build.query({
        query: () => ({ url: "/TestSession", params: { PageNumber: 1, PageSize: 1000 } }),
        transformResponse: (res) => unwrapList(res).items,
        providesTags: ["Session"],
      }),
      startSession: build.mutation({
        query: ({ testId, employeeId }) => ({
          url: "/TestSession/start",
          method: "POST",
          body: { testId: Number(testId), employeeId: Number(employeeId) },
        }),
        transformResponse: unwrapItem,
        invalidatesTags: ["Session"],
      }),
      submitSessionAnswer: build.mutation({
        query: ({ sessionId, questionId, optionId, textAnswer }) => ({
          url: "/TestSession/answer",
          method: "POST",
          body: {
            sessionId: Number(sessionId),
            questionId: Number(questionId),
            ...(optionId != null ? { optionId: Number(optionId) } : {}),
            ...(textAnswer?.trim() ? { textAnswer: textAnswer.trim() } : {}),
          },
        }),
        transformResponse: unwrapItem,
      }),
      finishSession: build.mutation({
        query: ({ sessionId, employeeId }) => ({
          url: `/TestSession/${sessionId}/finish`,
          method: "POST",
          params: { employeeId },
        }),
        transformResponse: unwrapItem,
        invalidatesTags: ["Session"],
      }),

      // ─── Назначения тестов сотрудникам ───
      getAssignments: build.query({
        query: () => ({ url: "/TestAssignment", params: { PageNumber: 1, PageSize: 1000 } }),
        transformResponse: (res) => unwrapList(res).items,
        providesTags: ["Assignment"],
      }),
      createAssignment: build.mutation({
        query: ({ testId, employeeId, subDepartmentId, dueDate }) => ({
          url: "/TestAssignment",
          method: "POST",
          body: {
            testId: Number(testId),
            employeeId: Number(employeeId),
            ...(subDepartmentId ? { subDepartmentId: Number(subDepartmentId) } : {}),
            ...(dueDate ? { dueDate } : {}),
          },
        }),
        invalidatesTags: ["Assignment"],
      }),
    }),
  });

export const {
  useGetQuestionsQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useGetAnswersQuery,
  useCreateAnswerMutation,
  useDeleteAnswerMutation,
  useGetTestsQuery,
  useCreateTestMutation,
  useUpdateTestMutation,
  useDeleteTestMutation,
  useGetSessionsQuery,
  useStartSessionMutation,
  useSubmitSessionAnswerMutation,
  useFinishSessionMutation,
  useGetAssignmentsQuery,
  useCreateAssignmentMutation,
} = testingApi;
