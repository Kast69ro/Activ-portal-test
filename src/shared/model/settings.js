import { createSlice } from "@reduxjs/toolkit";
import { DEFAULT_LANGUAGE, isSupportedLanguage } from "@/shared/i18n/languages";

export const SETTINGS_STORAGE_KEY = "activbank-settings";

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)) ?? {};
    // Язык из прежней HR-системы
    saved.language ??= localStorage.getItem("language");
    return saved;
  } catch {
    return {};
  }
}

const saved = loadSaved();

/** Пользовательские настройки интерфейса: тема, язык, свёрнутое меню. */
export const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    theme: saved.theme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
    language: isSupportedLanguage(saved.language) ? saved.language : DEFAULT_LANGUAGE,
    sidebarCollapsed: Boolean(saved.sidebarCollapsed),
  },
  reducers: {
    setTheme: (state, { payload }) => {
      state.theme = payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === "dark" ? "light" : "dark";
    },
    setLanguage: (state, { payload }) => {
      if (isSupportedLanguage(payload)) state.language = payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
  selectors: {
    selectTheme: (state) => state.theme,
    selectLanguage: (state) => state.language,
    selectSidebarCollapsed: (state) => state.sidebarCollapsed,
  },
});

export const { setTheme, toggleTheme, setLanguage, toggleSidebar } = settingsSlice.actions;
export const { selectTheme, selectLanguage, selectSidebarCollapsed } = settingsSlice.selectors;
