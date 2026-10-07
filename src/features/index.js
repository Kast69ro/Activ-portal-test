/**
 * Реестр фич сервиса.
 *
 * Каждая папка в src/features/ с файлом index.js — отдельная фича.
 * Она автоматически попадает в роутинг и боковое меню, регистрировать её вручную не нужно.
 *
 * Структура фичи (на примере chat):
 *   index.js         — описание страниц фичи (ниже)
 *   ChatPage.jsx     — страница (грузится лениво)
 *   chatApi.js       — запросы к серверу: RTK Query, baseApi.injectEndpoints(...)
 *   chatSlice.js     — локальное состояние (выбранный чат, онлайн, «печатает…»); необязателен
 *   locales/ru.json  — переводы; пространство имён i18n = имя папки
 *   locales/tj.json
 *
 * index.js экспортирует одну страницу или массив страниц:
 *   export default {
 *     id: "chat",                  // уникальный ключ
 *     path: "/chat",               // адрес
 *     icon: MessageCircle,         // иконка из lucide-react
 *     section: "communication",    // раздел меню из config/brand.js; null — не показывать в меню
 *     order: 10,                   // позиция в разделе
 *     roles: ["admin"],            // кому доступна; не указано — всем вошедшим
 *     titleKey: "title",           // ключ названия в переводах фичи (по умолчанию "title")
 *     layout: "app",               // "app" — с меню и шапкой, "blank" — на весь экран
 *     public: false,               // true — доступна без входа (страница логина)
 *     page: lazy(() => import("./ChatPage")),
 *     children: [{ path: ":id", page: lazy(...) }], // вложенные страницы
 *   };
 */
const found = import.meta.glob("./*/index.js", { eager: true, import: "default" });

export const features = Object.entries(found)
  .flatMap(([path, entry]) => {
    const ns = path.split("/")[1];
    return (Array.isArray(entry) ? entry : [entry]).map((page) => ({
      ns,
      titleKey: "title",
      layout: "app",
      ...page,
    }));
  })
  .filter((f) => f.enabled !== false)
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
