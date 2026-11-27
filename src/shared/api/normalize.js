/**
 * Бэкенд HR-системы (.NET) отдаёт данные в разных обёртках:
 *   [...]                                   — голый массив
 *   { data: [...], totalRecords }           — постраничный ответ
 *   { data: {...} }                         — один объект
 *   { items: [...], totalCount } / { $values: [...] }
 * Эти функции приводят ответ к одному виду, чтобы страницы о форматах не думали.
 * Используются в entities, features и shared/ui/QueryState.
 */

const LIST_KEYS = ["data", "items", "records", "results", "$values"];

/** Ответ со списком → { items, total } */
export function unwrapList(response) {
  if (Array.isArray(response)) return { items: response, total: response.length };
  if (!response || typeof response !== "object") return { items: [], total: 0 };

  for (const key of LIST_KEYS) {
    const value = response[key];
    if (Array.isArray(value)) {
      return {
        items: value,
        total: response.totalRecords ?? response.totalCount ?? response.total ?? value.length,
      };
    }
    if (value && typeof value === "object") {
      const nested = unwrapList(value);
      if (nested.items.length) return nested;
    }
  }
  return { items: [], total: 0 };
}

/** Только массив из ответа */
export const unwrapItems = (response) => unwrapList(response).items;

/** Ответ с одним объектом → объект */
export const unwrapItem = (response) => response?.data?.data ?? response?.data ?? response;

/** Человекочитаемый текст ошибки RTK Query */
export function getErrorMessage(error, fallback = "") {
  if (!error) return fallback;
  const data = error.data;
  if (typeof data === "string" && data.trim()) return data;
  return data?.message || data?.title || data?.error || error.error || error.message || fallback;
}

/** Сравнение id, пришедших то числом, то строкой */
export const sameId = (a, b) => a != null && b != null && String(a) === String(b);
