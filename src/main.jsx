/**
 * Точка входа: инициализирует i18n и монтирует приложение в #root.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Шрифт подключён локально: система работает во внутренней сети без доступа к Google Fonts
import "@fontsource-variable/manrope";
import "./index.css";
import { store } from "./app/store";
import { initI18n } from "./shared/i18n";
import App from "./app/App";

initI18n(store.getState().settings.language);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
