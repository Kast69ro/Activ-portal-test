import { combineSlices, configureStore, createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi, bindStore } from "@/shared/api/baseApi";
import i18n from "@/shared/i18n";
import { authSlice, loggedIn, loggedOut, persistAuth } from "@/shared/model/auth";
import {
  SETTINGS_STORAGE_KEY,
  setLanguage,
  setTheme,
  settingsSlice,
  toggleSidebar,
  toggleTheme,
} from "@/shared/model/settings";

/**
 * Store приложения.
 *
 * Состав:
 *   api        — кэш всех запросов (RTK Query). Эндпоинты — в src/entities/* и src/features/*\/<feature>Api.js
 *   auth       — сессия: токен, пользователь, роли (src/shared/model/auth.js)
 *   settings   — тема, язык, свёрнутое меню (src/shared/model/settings.js)
 *   <feature>  — слайсы фич: каждый файл src/features/<feature>/model/*Slice.js
 *                с `export default slice` подключается сюда автоматически
 */
const featureSlices = Object.values(import.meta.glob("../features/*/model/*Slice.js", { eager: true, import: "default" }));

export const rootReducer = combineSlices(baseApi, authSlice, settingsSlice, ...featureSlices);

const listener = createListenerMiddleware();

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) =>
    getDefault({
      // Файлы (File) в аргументах мутаций загрузки — нормальная ситуация
      serializableCheck: { ignoredActionPaths: ["meta.arg.originalArgs", "meta.baseQueryMeta"] },
    })
      .prepend(listener.middleware)
      .concat(baseApi.middleware),
});

bindStore(store);

// Перезапрос данных при возврате на вкладку и восстановлении сети
setupListeners(store.dispatch);

/** Применяет настройки к документу и i18n и сохраняет их. */
function applySettings({ theme, language, sidebarCollapsed }) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = language === "tj" ? "tg" : language;
  if (i18n.isInitialized && i18n.language !== language) i18n.changeLanguage(language);
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ theme, language, sidebarCollapsed }));
    localStorage.setItem("language", language);
  } catch {
    /* localStorage недоступен */
  }
}

listener.startListening({
  matcher: isAnyOf(setTheme, toggleTheme, setLanguage, toggleSidebar),
  effect: (_, api) => applySettings(api.getState().settings),
});

listener.startListening({
  matcher: isAnyOf(loggedIn, loggedOut),
  effect: (action, api) => {
    persistAuth(api.getState().auth);
    // После выхода данные прежнего пользователя не должны остаться в кэше
    if (loggedOut.match(action)) api.dispatch(baseApi.util.resetApiState());
  },
});

applySettings(store.getState().settings);
