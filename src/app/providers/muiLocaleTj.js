/** Тексты компонентов MUI на таджикском — в MUI нет готовой локали tg-TJ */
export const tjTJ = {
  components: {
    MuiBreadcrumbs: { defaultProps: { expandText: "Нишон додани роҳ" } },
    MuiTablePagination: {
      defaultProps: {
        getItemAriaLabel: (type) =>
          ({ first: "Ба саҳифаи аввал", last: "Ба саҳифаи охир", next: "Ба саҳифаи навбатӣ" })[type] ??
          "Ба саҳифаи қаблӣ",
        labelRowsPerPage: "Сатрҳо дар саҳифа:",
        labelDisplayedRows: ({ from, to, count }) => `${from}–${to} аз ${count !== -1 ? count : `зиёда аз ${to}`}`,
      },
    },
    MuiRating: {
      defaultProps: {
        getLabelText: (value) => `${value} ситора`,
        emptyLabelText: "Холӣ",
      },
    },
    MuiAutocomplete: {
      defaultProps: {
        clearText: "Тоза кардан",
        closeText: "Пӯшидан",
        loadingText: "Боркунӣ…",
        noOptionsText: "Ёфт нашуд",
        openText: "Кушодан",
      },
    },
    MuiAlert: { defaultProps: { closeText: "Пӯшидан" } },
    MuiPagination: {
      defaultProps: {
        "aria-label": "Саҳифабандӣ",
        getItemAriaLabel: (type, page, selected) => {
          if (type === "page") return `${selected ? "" : "Ба "}саҳифаи ${page}`;
          return (
            { first: "Ба саҳифаи аввал", last: "Ба саҳифаи охир", next: "Ба саҳифаи навбатӣ" }[type] ??
            "Ба саҳифаи қаблӣ"
          );
        },
      },
    },
  },
};
