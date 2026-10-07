/**
 * Слайс org (подключается в store автоматически). Используют все страницы домена.
 */
import { createSlice } from "@reduxjs/toolkit";

const DEFAULT_PAGE = { pageNumber: 1, pageSize: 10 };

/**
 * Состояние страниц оргструктуры: текущая страница таблиц и поиск по сотрудникам.
 * Сохраняется при переходах между разделами.
 */
const orgSlice = createSlice({
  name: "org",
  initialState: {
    pages: {},
    employeeSearch: "",
  },
  reducers: {
    setPage: (state, { payload: { key, page } }) => {
      state.pages[key] = page;
    },
    setEmployeeSearch: (state, { payload }) => {
      state.employeeSearch = payload;
      state.pages.employees = { ...(state.pages.employees ?? DEFAULT_PAGE), pageNumber: 1 };
    },
  },
  selectors: {
    selectPage: (state, key) => state.pages[key] ?? DEFAULT_PAGE,
    selectEmployeeSearch: (state) => state.employeeSearch,
  },
});

export const { setPage, setEmployeeSearch } = orgSlice.actions;
export const { selectPage, selectEmployeeSearch } = orgSlice.selectors;

export default orgSlice;
