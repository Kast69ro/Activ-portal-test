/**
 * Список поддерживаемых языков интерфейса и вспомогательные функции для них.
 */
/**
 * Поддерживаемые языки. Чтобы добавить язык:
 * 1) добавьте его сюда;
 * 2) положите <code>.json в src/shared/i18n/locales/ и в locales/ каждой фичи;
 * 3) npm run i18n:check покажет, каких ключей не хватает.
 *
 * Код "tj" совпадает с тем, что прежняя HR-система хранила в localStorage.
 */
export const LANGUAGES = [
  { code: "ru", label: "Русский", short: "RU", locale: "ru-RU" },
  { code: "tj", label: "Тоҷикӣ", short: "TJ", locale: "tg-TJ" },
];

export const DEFAULT_LANGUAGE = "ru";

export const isSupportedLanguage = (code) => LANGUAGES.some((l) => l.code === code);

/** "tj" → "tg-TJ" — для Intl-форматирования чисел и дат */
export const getLocale = (code) => LANGUAGES.find((l) => l.code === code)?.locale ?? "ru-RU";
