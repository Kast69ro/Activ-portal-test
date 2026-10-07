/**
 * Точка входа: инициализирует i18n, в режиме моков (VITE_USE_MOCKS=true) подключает src/mocks
 * и монтирует приложение в #root.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Шрифт подключён локально: система работает во внутренней сети без доступа к Google Fonts
import "@fontsource-variable/manrope";
import "./index.css";
import { env } from "./config/env";
import { store } from "./app/store";
import { initI18n } from "./shared/i18n";
import App from "./app/App";

initI18n(store.getState().settings.language);

// Моки подключаются только по VITE_USE_MOCKS=true и не попадают в обычную сборку
const ready = env.useMocks ? import("./mocks") : Promise.resolve();

ready.then(() =>
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
);
