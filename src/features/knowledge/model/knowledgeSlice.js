import { createSlice } from "@reduxjs/toolkit";

/** Выбранная папка и поиск — отдельно для видеоуроков и документации */
const knowledgeSlice = createSlice({
  name: "knowledge",
  initialState: {
    // library → id папки | "all" | "none" (без папки)
    folder: { video: "all", documentation: "all" },
    search: { video: "", documentation: "" },
  },
  reducers: {
    selectFolder: (state, { payload: { library, folder } }) => {
      state.folder[library] = folder;
    },
    setSearch: (state, { payload: { library, search } }) => {
      state.search[library] = search;
    },
  },
  selectors: {
    selectSelectedFolder: (state, library) => state.folder[library],
    selectSearch: (state, library) => state.search[library],
  },
});

export const { selectFolder, setSearch } = knowledgeSlice.actions;
export const { selectSelectedFolder, selectSearch } = knowledgeSlice.selectors;

export default knowledgeSlice;
