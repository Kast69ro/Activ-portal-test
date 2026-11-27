/**
 * API сервиса стажёров (service: "interns"). Теги: Intern.
 * Используют: intern-history (все страницы), testing (LinkDialog — одноразовые ссылки).
 */
import { baseApi } from "@/shared/api/baseApi";

/**
 * Сервис стажёров (VITE_INTERNS_API_URL): одноразовые ссылки на тесты, филиалы,
 * стажёры и их попытки. Ответы в snake_case, списки — { items, total }.
 */
export const internsApi = baseApi.enhanceEndpoints({ addTagTypes: ["Intern"] }).injectEndpoints({
  endpoints: (build) => ({
    /** Одноразовая ссылка для стажёра → { respondent_url | form_url } */
    generateTestLink: build.mutation({
      query: ({ testId, durationMinutes }) => ({
        url: "/admin/forms",
        method: "POST",
        service: "interns",
        body: { test_id: Number(testId), duration_minutes: Number(durationMinutes) },
      }),
      transformResponse: (res) => {
        const body = res?.data && !res?.form_url ? res.data : res;
        return body?.respondent_url || body?.form_url || "";
      },
    }),
    getBranches: build.query({
      query: () => ({ url: "/branches", service: "interns" }),
      transformResponse: (res) => res?.items ?? [],
    }),
    getInterns: build.query({
      query: ({ search, branchId, limit = 20, offset = 0 }) => ({
        url: "/interns",
        service: "interns",
        params: { ...(search ? { search } : {}), ...(branchId ? { branch_id: branchId } : {}), limit, offset },
      }),
      transformResponse: (res) => ({ items: res?.items ?? [], total: res?.total ?? 0 }),
      providesTags: ["Intern"],
    }),
    getIntern: build.query({
      query: ({ id, status, limit = 10, offset = 0 }) => ({
        url: `/interns/${id}`,
        service: "interns",
        params: { ...(status ? { status } : {}), limit, offset },
      }),
      transformResponse: (res) => ({
        intern: res?.intern,
        attempts: res?.attempts ?? [],
        attemptsTotal: res?.attempts_total ?? 0,
      }),
      providesTags: ["Intern"],
    }),
    getAttempt: build.query({
      query: (id) => ({ url: `/attempts/${id}`, service: "interns" }),
    }),
  }),
});

export const {
  useGenerateTestLinkMutation,
  useGetBranchesQuery,
  useGetInternsQuery,
  useGetInternQuery,
  useGetAttemptQuery,
} = internsApi;

/** «Фамилия Имя Отчество» стажёра */
export const internFullName = (i) => [i?.last_name, i?.first_name, i?.middle_name].filter(Boolean).join(" ");
