/**
 * Адреса бэкендов. Задаются в .env (см. .env.example).
 *
 * HR-система работает с четырьмя сервисами:
 *   main     — основной API (оргструктура, тесты, база знаний, авторизация)
 *   chat     — чат (REST + WebSocket)
 *   articles — статьи и комментарии
 *   interns  — стажёры, одноразовые ссылки на тесты
 *
 * Используют shared/api (baseApi, rates), shared/lib/files и WebSocket чата.
 */
const trimSlash = (url = "") => url.replace(/\/+$/, "");

export const env = {
  apiUrl: trimSlash(import.meta.env.VITE_API_URL),
  chatUrl: trimSlash(import.meta.env.VITE_CHAT_API_URL),
  articlesUrl: trimSlash(import.meta.env.VITE_ARTICLES_API_URL),
  internsUrl: trimSlash(import.meta.env.VITE_INTERNS_API_URL),
  ratesUrl: trimSlash(import.meta.env.VITE_RATES_URL) || "/nbt-rates",
  useMocks: import.meta.env.VITE_USE_MOCKS === "true",
};

/** Базовый путь REST для каждого сервиса */
export const SERVICES = {
  main: `${env.apiUrl}/api`,
  chat: `${env.chatUrl}/api`,
  articles: `${env.articlesUrl}/api`,
  interns: `${env.internsUrl}/api/v1`,
};

/** Корень сервиса — для ссылок на загруженные файлы (картинки, видео, документы) */
export const FILE_HOSTS = {
  main: env.apiUrl,
  chat: env.chatUrl,
  articles: env.articlesUrl,
};

/** WebSocket чата */
export const CHAT_WS_URL = `${env.chatUrl.replace(/^http/, "ws")}/api/ws`;
