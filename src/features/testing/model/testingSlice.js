import { createSlice } from "@reduxjs/toolkit";

/** Настройки страниц тестирования, которые не должны сбрасываться при переходах */
const testingSlice = createSlice({
  name: "testing",
  initialState: {
    showRanking: true,
    testsPage: 1,
    surveysPage: 1,
  },
  reducers: {
    toggleRanking: (state) => {
      state.showRanking = !state.showRanking;
    },
    setTestsPage: (state, { payload }) => {
      state.testsPage = payload;
    },
    setSurveysPage: (state, { payload }) => {
      state.surveysPage = payload;
    },
  },
  selectors: {
    selectShowRanking: (state) => state.showRanking,
    selectTestsPage: (state) => state.testsPage,
    selectSurveysPage: (state) => state.surveysPage,
  },
});

export const { toggleRanking, setTestsPage, setSurveysPage } = testingSlice.actions;
export const { selectShowRanking, selectTestsPage, selectSurveysPage } = testingSlice.selectors;

export default testingSlice;
