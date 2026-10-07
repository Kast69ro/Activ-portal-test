/**
 * Моки основного API — чтобы запустить интерфейс без доступа к внутренней сети банка.
 * Включаются только явно: VITE_USE_MOCKS=true в .env.
 *
 * Обработчики регистрирует src/mocks (подключается в main.jsx только в режиме моков).
 * Чат, статьи и сервис стажёров не мокаются — эти разделы покажут ошибку загрузки.
 */
const handlers = [];

/**
 * Регистрирует обработчики: { "GET /Department": ({ params }) => ..., "PUT /Department/:id": ({ id, body }) => ... }
 * Обработчик может бросить { status, data } — это вернётся как ошибка запроса.
 */
export function registerMocks(map) {
  for (const [key, handler] of Object.entries(map)) {
    const [method, pattern] = key.split(" ");
    const names = [];
    const regex = new RegExp(
      `^${pattern.replace(/:(\w+)/g, (_, name) => {
        names.push(name);
        return "([^/]+)";
      })}$`,
    );
    handlers.push({ method, regex, names, handler });
  }
}

export async function mockBaseQuery(args) {
  const { url, method = "GET", body, params, service = "main" } = typeof args === "string" ? { url: args } : args;
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

  const [path, search] = url.split("?");
  const query = { ...Object.fromEntries(new URLSearchParams(search)), ...params };
  const found = service === "main" && handlers.find((h) => h.method === method.toUpperCase() && h.regex.test(path));

  if (!found) {
    return { error: { status: 503, data: { message: `Нет мока для ${method} ${service}:${path}` } } };
  }

  const values = path.match(found.regex).slice(1);
  const routeParams = Object.fromEntries(found.names.map((name, i) => [name, decodeURIComponent(values[i])]));

  try {
    const plainBody = body instanceof FormData ? Object.fromEntries(body.entries()) : body;
    return { data: structuredClone(await found.handler({ ...routeParams, body: plainBody, params: query })) };
  } catch (error) {
    return { error: error?.status ? error : { status: 500, data: { message: String(error) } } };
  }
}
