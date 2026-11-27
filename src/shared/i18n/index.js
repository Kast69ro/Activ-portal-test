/**
 * Настройка i18next: собирает переводы common и переводы всех доменов (features/*\/locales).
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE } from "./languages";

/*
 * Переводы собираются автоматически:
 *   src/shared/i18n/locales/<lng>.json        → пространство имён "common"
 *   src/features/<feature>/locales/<lng>.json → пространство имён "<feature>"
 */
const commonLocales = import.meta.glob("./locales/*.json", { eager: true, import: "default" });
const featureLocales = import.meta.glob("../../features/*/locales/*.json", { eager: true, import: "default" });

const resources = {};

for (const [path, data] of Object.entries(commonLocales)) {
  const lng = path.match(/(\w+)\.json$/)[1];
  (resources[lng] ??= {}).common = data;
}

for (const [path, data] of Object.entries(featureLocales)) {
  const [, ns, lng] = path.match(/features\/([^/]+)\/locales\/(\w+)\.json$/);
  (resources[lng] ??= {})[ns] = data;
}

export function initI18n(language) {
  return i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: "common",
    interpolation: { escapeValue: false },
  });
}

export default i18n;
