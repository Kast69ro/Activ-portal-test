# Активбанк — HR-система

База знаний, тестирование и общение сотрудников банка.
Стек: **React 19 · Vite · MUI 9 + Tailwind CSS 4 · Redux Toolkit + RTK Query · i18next (RU / TJ) · React Router 7**.

```bash
cp .env.example .env   # адреса бэкендов
npm install
npm run dev            # http://localhost:3000
npm run build
npm run lint
npm run i18n:check     # все ли ключи переведены на оба языка
```

## Разделы

| Раздел | Адрес | Кому |
|---|---|---|
| Главная | `/` | всем |
| Управления, отделы, должности, сотрудники | `/department`, `/subdepartment`, `/position`, `/employee` | Admin |
| Видеоуроки, документация | `/video-lessons`, `/documentation` | всем (управляет Admin) |
| Тесты, прохождение теста | `/test`, `/test/run` | всем (создаёт Admin) |
| Опросы | `/surveys` | всем (создаёт Admin) |
| Результаты тестов, результаты опросов | `/test-taking`, `/survey-results` | Admin |
| История стажёров | `/test-history` | Admin |
| Чат | `/chat` | всем |
| Банк вопросов, ручной ввод ответов | `/question`, `/reply` | Admin, нет в меню |

«Admin» — роли `Admin` и `SuperAdmin`. Страница для администраторов, открытая без прав, покажет «Нет доступа».

## Бэкенды

Адреса — в `.env` (см. `.env.example`), разбор — в `src/config/env.js`.

| Сервис | Переменная | Авторизация |
|---|---|---|
| Основной API (.NET) | `VITE_API_URL` | `Authorization: Bearer <jwt>` |
| Чат (REST + WebSocket) | `VITE_CHAT_API_URL` | заголовок `Login: <логин>` |
| Стажёры | `VITE_INTERNS_API_URL` | — |
| Курсы НБТ | `VITE_RATES_URL` | — |

Курсы Нацбанка Таджикистана (`nbt.tj`) не отдают CORS-заголовки: при `npm run dev` / `npm run preview`
запросы идут через прокси Vite, в продакшене нужен прокси на сервере (см. `src/shared/api/rates.js`).

## Структура

```
src/
├── app/                   # сборка приложения
│   ├── App.jsx            # провайдеры: Redux, тема MUI, уведомления, роутер
│   ├── router.jsx         # роуты строятся из реестра фич
│   ├── guards.jsx         # вход обязателен, страницы по ролям
│   ├── store.js           # Redux store
│   └── providers/         # тема MUI на фирменных цветах, таджикская локаль MUI
├── config/                # бренд, разделы меню, адреса сервисов
├── layouts/               # меню, шапка, курсы НБТ, FAQ
├── entities/              # данные, нужные нескольким фичам
│   ├── org/orgApi.js          — управления, отделы, должности, сотрудники
│   ├── testing/               — вопросы, тесты, опросы, сессии + модель (типы, статусы, тексты RU/TJ)
│   ├── knowledge/             — папки и материалы базы знаний
│   ├── interns/               — сервис стажёров
│   └── users/                 — вход, пользователи
├── features/              # разделы — каждый в своей папке
│   ├── index.js           # реестр: подхватывает фичи автоматически
│   ├── auth/  home/  org/  knowledge/  testing/  intern-history/  chat/
│   └── chat/
│       ├── index.js       # описание страниц фичи
│       ├── ChatPage.jsx
│       ├── chatApi.js     # запросы (RTK Query)
│       ├── chatSlice.js   # состояние: открытый чат, онлайн, «печатает…»
│       ├── useChatSocket.js
│       ├── components/
│       └── locales/       # ru.json, tj.json
├── pages/                 # 403, 404
└── shared/
    ├── api/               # baseApi (все сервисы), разбор ответов .NET, курсы НБТ
    ├── i18n/              # i18next, языки, общие переводы
    ├── model/             # слайсы auth (сессия, роли) и settings (тема, язык, меню)
    ├── lib/               # форматирование дат/чисел, файлы, useDebounce
    └── ui/                # PageHeader, QueryState, EmptyState, StatCard, FileTile, useToast, useConfirm…
```

**Правила:**
- фича не импортирует другую фичу; общее — в `entities/` (данные) или `shared/` (всё остальное);
- данные с сервера живут только в RTK Query; в слайсах — то, что знает только интерфейс
  (фильтры, выбранный элемент, настройки страницы);
- компоненты — из MUI (`@mui/material`), раскладка и отступы — классами Tailwind.

## Как добавить раздел

1. Папка `src/features/reports/` с `index.js`:

```js
import { lazy } from "react";
import { FileBarChart } from "lucide-react";

export default {
  id: "reports",
  path: "/reports",
  icon: FileBarChart,
  section: "administration", // раздел меню (config/brand.js); null — не показывать
  order: 60,
  roles: ["admin"],          // не указано — всем вошедшим
  page: lazy(() => import("./ReportsPage")),
};
```

2. `locales/ru.json` и `locales/tj.json` — минимум `{ "title": "Отчёты" }` (название в меню).
3. Запросы — `reportsApi.js`, состояние — `reportsSlice.js` (подключится в store сам):

```js
// reportsApi.js
import { baseApi } from "@/shared/api/baseApi";
import { unwrapList } from "@/shared/api/normalize";

export const reportsApi = baseApi.enhanceEndpoints({ addTagTypes: ["Report"] }).injectEndpoints({
  endpoints: (build) => ({
    getReports: build.query({
      query: () => "/Report",                // основной API; для чата: { url, service: "chat" }
      transformResponse: unwrapList,         // { data, totalRecords } → { items, total }
      providesTags: ["Report"],
    }),
  }),
});
export const { useGetReportsQuery } = reportsApi;
```

На странице загрузку и ошибку обрабатывает `QueryState`, уведомления — `useToast()`, подтверждения — `useConfirm()`.

## Языки

RU и TJ. Тексты интерфейса — `src/shared/i18n/locales/` и `locales/` каждой фичи.
Содержимое тестов (вопросы, варианты, названия) приходит с сервера на двух языках (`contentRu` / `contentTj`) —
показывается на языке интерфейса, если перевода нет — на русском.
`npm run i18n:check` находит недостающие ключи.

## Фирменный стиль

Цвета — `src/index.css` (Tailwind) и `src/app/providers/MuiProvider.jsx` (MUI), основной — `#e31e24` из логотипа.
Логотип — `src/shared/assets/logo.png`, знак «А» в векторе — `src/shared/ui/Logo.jsx`.
Шрифт Manrope подключён локально (пакет `@fontsource-variable/manrope`), без обращения к Google Fonts.

## Отличия от прежней HR-системы

- **Результаты опросов по-прежнему хранятся только в браузере** (localStorage, ключ `survey_results`):
  на бэкенде нет для них API. С другого компьютера их не видно. Место для замены — `src/features/testing/model/surveyResultsSlice.js`.
- Страницы администратора закрыты для Basic и по прямой ссылке (раньше скрывался только пункт меню).
- Чат — в меню у всех ролей (раньше пункт видели только Basic).
- Кабинета сотрудника (`/select-employee`) больше нет.
- При истёкшем токене (ответ 401) выполняется выход на страницу входа.
- Тип вопроса отправляется числом (1/2/3) — раньше часть страниц слала строку `"MultipleChoice"`.
- Прохождение теста переживает обновление вкладки: та же сессия, таймер не сбрасывается.
- «Пройти снова» в результатах опросов открывает запуск опроса, счётчик попыток растёт.
- Убраны конфетти, анимации framer-motion и лайки в базе знаний (они не сохранялись).
