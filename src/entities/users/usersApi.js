/**
 * API учётных записей (service: "main"): вход, регистрация, список пользователей. Тегов нет.
 * Используют: auth (вход/регистрация), layouts/Topbar.
 */
import { baseApi } from "@/shared/api/baseApi";
import { unwrapList } from "@/shared/api/normalize";

/** Учётные записи (вход в систему) — основной API, /Account и /User */
export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation({
      query: (body) => ({ url: "/Account/login", method: "POST", body }),
      // { data: { jwToken, roles, userName, ... } }
      transformResponse: (res) => res?.data ?? res,
    }),
    register: build.mutation({
      query: (body) => ({ url: "/Account/register", method: "POST", body }),
    }),
    /** Пользователи, вошедшие в систему (колокольчик администратора) */
    getUsers: build.query({
      query: ({ pageNumber = 1, pageSize = 10 } = {}) => ({ url: "/User", params: { pageNumber, pageSize } }),
      transformResponse: unwrapList,
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useGetUsersQuery } = usersApi;

/** Имя пользователя из записи /User — бэкенд отдаёт поля в разном регистре */
export const userDisplayName = (u) =>
  [u?.firstName ?? u?.FirstName, u?.lastName ?? u?.LastName].filter(Boolean).join(" ").trim() ||
  u?.fullName ||
  u?.userName ||
  u?.username ||
  "—";

export const userRoles = (u) => {
  const roles = u?.roles ?? u?.Roles;
  return Array.isArray(roles) ? roles.join(", ") : (u?.role ?? u?.Role ?? "Basic");
};

export const userLoginTime = (u) =>
  u?.loginTime ?? u?.loggedInAt ?? u?.lastLogin ?? u?.lastLoginTime ?? u?.createdAt ?? null;
