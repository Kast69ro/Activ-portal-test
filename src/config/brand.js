/**
 * Настройки бренда (сайт, почта поддержки) и порядок разделов бокового меню.
 * Используется в layouts (Sidebar, FaqDialog) и на главной странице.
 */
/** Общие настройки бренда и сервиса. Тексты интерфейса — в src/shared/i18n/locales. */
export const brand = {
  site: "https://activbank.tj",
  supportEmail: "OKevorkova@activbank.tj",
};

/** Разделы бокового меню. Порядок здесь = порядок в меню. Названия — common:nav.<id> */
export const navSections = ["main", "administration", "monitoring", "knowledge", "testing", "communication"];
