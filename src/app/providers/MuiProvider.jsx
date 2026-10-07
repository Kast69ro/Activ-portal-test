import { useMemo } from "react";
import { useSelector } from "react-redux";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { StyledEngineProvider, ThemeProvider, createTheme } from "@mui/material/styles";
import { ruRU } from "@mui/material/locale";
import { selectLanguage, selectTheme } from "@/shared/model/settings";
import { tjTJ } from "./muiLocaleTj";

/*
 * Тема MUI на тех же токенах, что и Tailwind (src/index.css).
 * Поменяли цвет бренда — поменяйте и здесь, и в index.css.
 */
const BRAND = { main: "#e31e24", light: "#ea3a40", dark: "#bf161c", contrastText: "#fff" };

const PALETTES = {
  light: {
    mode: "light",
    primary: BRAND,
    background: { default: "#f6f7f9", paper: "#ffffff" },
    text: { primary: "#1c2029", secondary: "#66718a" },
    divider: "#e3e6ec",
  },
  dark: {
    mode: "dark",
    primary: BRAND,
    background: { default: "#12151b", paper: "#1c2029" },
    text: { primary: "#f6f7f9", secondary: "#8590a5" },
    divider: "#2b303c",
  },
};

function buildTheme(mode, language) {
  return createTheme(
    {
      palette: {
        ...PALETTES[mode],
        success: { main: "#16a34a" },
        warning: { main: "#d97706" },
        info: { main: "#2563eb" },
      },
      shape: { borderRadius: 12 },
      typography: {
        fontFamily: '"Manrope Variable", "Manrope", ui-sans-serif, system-ui, sans-serif',
        button: { textTransform: "none", fontWeight: 700 },
        h1: { fontWeight: 800 },
        h2: { fontWeight: 800 },
        h3: { fontWeight: 800 },
        h4: { fontWeight: 800 },
        h5: { fontWeight: 700 },
        h6: { fontWeight: 700 },
        subtitle1: { fontWeight: 700 },
        subtitle2: { fontWeight: 700 },
      },
      components: {
        MuiButton: { defaultProps: { disableElevation: true } },
        MuiTextField: { defaultProps: { size: "small" } },
        MuiSelect: { defaultProps: { size: "small" } },
        MuiAutocomplete: { defaultProps: { size: "small" } },
        MuiFormControl: { defaultProps: { size: "small" } },
        MuiPaper: { styleOverrides: { rounded: { borderRadius: 20 } } },
        MuiCard: {
          defaultProps: { variant: "outlined" },
          styleOverrides: { root: { borderRadius: 20 } },
        },
        MuiDialog: { styleOverrides: { paper: { borderRadius: 20 } } },
        MuiDialogTitle: { styleOverrides: { root: { fontWeight: 800, fontSize: "1.15rem" } } },
        MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
        MuiTooltip: { defaultProps: { arrow: true } },
        MuiTableCell: {
          styleOverrides: { head: { fontWeight: 700, whiteSpace: "nowrap" } },
        },
        MuiMenu: { styleOverrides: { paper: { borderRadius: 14 } } },
      },
    },
    language === "tj" ? tjTJ : ruRU,
  );
}

export function MuiProvider({ children }) {
  const mode = useSelector(selectTheme);
  const language = useSelector(selectLanguage);
  const theme = useMemo(() => buildTheme(mode, language), [mode, language]);

  return (
    // enableCssLayer кладёт стили MUI в слой @layer mui — утилиты Tailwind их перекрывают
    <StyledEngineProvider enableCssLayer>
      {/* Порядок слоёв объявляется первым же стилем Emotion — иначе в dev-режиме слой mui окажется ниже base Tailwind */}
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
