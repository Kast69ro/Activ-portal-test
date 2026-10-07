import { createSlice } from "@reduxjs/toolkit";

/*
 * Результаты опросов.
 *
 * ВНИМАНИЕ: у бэкенда нет эндпоинта для результатов опросов, поэтому — как и в прежней системе —
 * они хранятся только в localStorage этого браузера (ключ "survey_results", формат совместим).
 * С другого компьютера их не видно. Когда появится API, замените saveSurveyResult на мутацию RTK Query.
 */
const STORAGE_KEY = "survey_results";

const load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const surveyResultsSlice = createSlice({
  name: "surveyResults",
  initialState: { items: load() },
  reducers: {
    /** Повторное прохождение того же опроса тем же сотрудником заменяет результат и увеличивает номер попытки */
    resultSaved: (state, { payload }) => {
      const i = state.items.findIndex(
        (r) => String(r.surveyId) === String(payload.surveyId) && String(r.employeeId) === String(payload.employeeId),
      );
      if (i === -1) state.items.push({ ...payload, attemptCount: 1 });
      else state.items[i] = { ...state.items[i], ...payload, attemptCount: (state.items[i].attemptCount ?? 1) + 1 };
    },
  },
  selectors: {
    selectSurveyResults: (state) => state.items,
  },
});

export const { selectSurveyResults } = surveyResultsSlice.selectors;

/** Сохраняет результат и записывает список в localStorage */
export const saveSurveyResult = (result) => (dispatch, getState) => {
  dispatch(surveyResultsSlice.actions.resultSaved(result));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getState().surveyResults.items));
  } catch {
    /* localStorage недоступен */
  }
};

export const MAX_SURVEY_ATTEMPTS = 2;

export default surveyResultsSlice;
