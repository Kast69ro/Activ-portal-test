/**
 * Единственный createApi проекта: выбор сервиса (main/chat/interns) по полю service запроса,
 * заголовки авторизации, выход при 401 и authorizedFetch для скачивания файлов.
 */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { SERVICES } from "@/config/env";
import i18n from "@/shared/i18n";
import { loggedOut } from "@/shared/model/auth";

/**
 * Единый RTK Query API.
 *
 * Сущности (src/entities) и фичи (src/features) не создают свои createApi, а расширяют этот:
 *   export const chatApi = baseApi.injectEndpoints({ endpoints: (build) => ({ ... }) });
 * Так все запросы делят один кэш, middleware и инвалидацию по тегам.
 *
 * Запрос уходит в нужный сервис по полю service (по умолчанию "main"):
 *   query: () => ({ url: "/chats", service: "chat" })
 * Адреса сервисов — в .env, см. src/config/env.js.
 */

/** Заголовки для каждого сервиса. Чат авторизует по логину, основной API — по JWT. */
function applyHeaders(service, headers, state) {
  const { token, user } = state.auth;
  const login = (user?.userName ?? "").trim();

  if (service === "main") {
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Accept-Language", i18n.language === "tj" ? "tg" : "ru");
  }
  if (service === "chat" && login) {
    headers.set("Login", login);
  }
  return headers;
}

const queries = Object.fromEntries(
  Object.entries(SERVICES).map(([service, baseUrl]) => [
    service,
    fetchBaseQuery({
      baseUrl,
      prepareHeaders: (headers, { getState }) => applyHeaders(service, headers, getState()),
    }),
  ]),
);

async function httpBaseQuery(args, api, extraOptions) {
  const { service = "main", ...request } = typeof args === "string" ? { url: args } : args;
  const result = await queries[service](request, api, extraOptions);

  // Токен истёк или отозван — завершаем сессию, роутер отправит на страницу входа
  if (result.error?.status === 401 && service === "main" && api.getState().auth.token) {
    api.dispatch(loggedOut());
  }
  return result;
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: httpBaseQuery,
  // Сущности и фичи добавляют свои теги через baseApi.enhanceEndpoints({ addTagTypes: [...] })
  tagTypes: [],
  endpoints: () => ({}),
});

let storeRef = null;
/** Вызывается из app/store.js — нужен authorizedFetch для доступа к сессии */
export const bindStore = (store) => {
  storeRef = store;
};

/**
 * fetch с теми же заголовками, что и у RTK Query, — для того, что не должно попадать в store:
 * скачивание файлов (Blob), загрузка с прогрессом и т.п.
 */
export async function authorizedFetch(service, path, init = {}) {
  const headers = applyHeaders(service, new Headers(init.headers), storeRef.getState());
  const response = await fetch(`${SERVICES[service]}${path}`, { ...init, headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}
