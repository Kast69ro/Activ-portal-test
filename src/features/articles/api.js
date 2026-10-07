/**
 * API статей и комментариев (service: "articles"). Теги: Article, ArticleComments, MyArticles.
 * Используется только доменом articles.
 */
import { baseApi } from "@/shared/api/baseApi";

/**
 * Статьи и комментарии (сервис articles, авторизация заголовком Login).
 * Создание и правка статьи — multipart: title, description, text, status, cover, video.
 */
const list = (res) => (Array.isArray(res) ? res : (res?.items ?? res?.data ?? []));
const svc = (url, extra = {}) => ({ url, service: "articles", ...extra });

export const articlesApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["Article", "ArticleComments", "MyArticles"] })
  .injectEndpoints({
    endpoints: (build) => ({
      getArticles: build.query({
        query: ({ query = "", limit = 20, offset = 0 } = {}) => svc("/articles", { params: { limit, offset, query } }),
        transformResponse: list,
        providesTags: ["Article"],
      }),
      getArticle: build.query({
        query: (id) => svc(`/articles/${id}`),
        providesTags: (_, __, id) => [{ type: "Article", id }],
      }),
      createArticle: build.mutation({
        query: (form) => svc("/articles", { method: "POST", body: form }),
        invalidatesTags: ["Article", "MyArticles"],
      }),
      updateArticle: build.mutation({
        query: ({ id, form }) => svc(`/articles/${id}`, { method: "PUT", body: form }),
        invalidatesTags: ["Article", "MyArticles"],
      }),
      deleteArticle: build.mutation({
        query: (id) => svc(`/articles/${id}`, { method: "DELETE" }),
        invalidatesTags: ["Article", "MyArticles"],
      }),

      // ─── Комментарии (дерево: replies) ───
      getComments: build.query({
        query: (articleId) => svc(`/articles/${articleId}/comments`),
        transformResponse: list,
        providesTags: (_, __, articleId) => [{ type: "ArticleComments", id: articleId }],
      }),
      createComment: build.mutation({
        query: ({ articleId, text, parentId }) =>
          svc(`/articles/${articleId}/comments`, { method: "POST", body: { text, parent_id: parentId ?? null } }),
        invalidatesTags: (_, __, { articleId }) => [{ type: "ArticleComments", id: articleId }],
      }),
      updateComment: build.mutation({
        query: ({ id, text }) => svc(`/comments/${id}`, { method: "PUT", body: { text } }),
        invalidatesTags: (_, __, { articleId }) => [{ type: "ArticleComments", id: articleId }],
      }),
      deleteComment: build.mutation({
        query: ({ id }) => svc(`/comments/${id}`, { method: "DELETE" }),
        invalidatesTags: (_, __, { articleId }) => [{ type: "ArticleComments", id: articleId }],
      }),

      // ─── Мои статьи (/me) ───
      getMyProfile: build.query({
        query: () => svc("/me"),
        providesTags: ["MyArticles"],
      }),
      updateMyArticle: build.mutation({
        query: ({ id, ...body }) => svc(`/me/articles/${id}`, { method: "PUT", body }),
        invalidatesTags: ["MyArticles", "Article"],
      }),
      updateMyArticleFiles: build.mutation({
        query: ({ id, form }) => svc(`/me/articles/${id}/files`, { method: "PUT", body: form }),
        invalidatesTags: ["MyArticles", "Article"],
      }),
      deleteMyArticle: build.mutation({
        query: (id) => svc(`/me/articles/${id}`, { method: "DELETE" }),
        invalidatesTags: ["MyArticles", "Article"],
      }),
    }),
  });

export const {
  useGetArticlesQuery,
  useGetArticleQuery,
  useCreateArticleMutation,
  useUpdateArticleMutation,
  useDeleteArticleMutation,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useGetMyProfileQuery,
  useUpdateMyArticleMutation,
  useUpdateMyArticleFilesMutation,
  useDeleteMyArticleMutation,
} = articlesApi;
