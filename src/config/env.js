/**
 * Адреса бэкендов. Задаются в .env (см. .env.example).
 *
 * HR-система работает с пятью сервисами:
 *   main     — основной API (оргструктура, тесты, база знаний, авторизация)
 *   chat     — чат (REST + WebSocket)
 *   interns  — стажёры, одноразовые ссылки на тесты
 *   atm      — мониторинг банкоматов (PHP-сервис)
 *   transactions — транзакции по банкоматам
 *
 * Используют shared/api (baseApi, rates), shared/lib/files и WebSocket чата.
 */
const trimSlash = (url = "") => url.replace(/\/+$/, "");

export const env = {
  apiUrl: trimSlash(import.meta.env.VITE_API_URL),
  chatUrl: trimSlash(import.meta.env.VITE_CHAT_API_URL),
  internsUrl: trimSlash(import.meta.env.VITE_INTERNS_API_URL),
  atmUrl: trimSlash(import.meta.env.VITE_ATM_API_URL),
  transactionsUrl: trimSlash(import.meta.env.VITE_TRANSACTIONS_API_URL),
  ratesUrl: trimSlash(import.meta.env.VITE_RATES_URL) || "/nbt-rates",
};

/** Базовый путь REST для каждого сервиса */
export const SERVICES = {
  main: `${env.apiUrl}/api`,
  chat: `${env.chatUrl}/api`,
  interns: `${env.internsUrl}/api/v1`,
  atm: `${env.atmUrl}/services`,
  transactions: `${env.transactionsUrl}/api`,
};

/** Корень сервиса — для ссылок на загруженные файлы (картинки, видео, документы) */
export const FILE_HOSTS = {
  main: env.apiUrl,
  chat: env.chatUrl,
};

/** WebSocket чата */
export const CHAT_WS_URL = `${env.chatUrl.replace(/^http/, "ws")}/api/ws`;
