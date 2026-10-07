/**
 * Адрес страницы прохождения теста.
 *   Новая попытка:  /test/run?test=1&employee=5&duration=10
 *   Продолжение:    /test/run?session=42&duration=10
 * После старта страница сама заменяет адрес на вариант с session — так обновление вкладки
 * продолжает ту же сессию, а не начинает новую.
 */
export function runUrl({ testId, employeeId, sessionId, duration }) {
  const params = new URLSearchParams();
  if (sessionId != null) params.set("session", sessionId);
  else {
    params.set("test", testId);
    params.set("employee", employeeId);
  }
  params.set("duration", duration);
  return `/test/run?${params}`;
}
