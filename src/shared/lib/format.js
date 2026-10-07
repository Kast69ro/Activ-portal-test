import i18n from "@/shared/i18n";
import { getLocale } from "@/shared/i18n/languages";

/*
 * Форматирование учитывает текущий язык интерфейса.
 * Intl-форматтеры дорогие в создании, поэтому кэшируются по локали и параметрам.
 */
const cache = new Map();

function getFormatter(Ctor, options) {
  let locale = getLocale(i18n.language);
  if (!Intl[Ctor.name].supportedLocalesOf([locale]).length) locale = "ru-RU";
  const key = `${Ctor.name}|${locale}|${JSON.stringify(options)}`;
  if (!cache.has(key)) cache.set(key, new Ctor(locale, options));
  return cache.get(key);
}

/** .NET отдаёт «пустую» дату как 0001-01-01 */
const isEmptyDate = (date) => !date || String(date).startsWith("0001-01-01");

export const formatNumber = (value, options) => getFormatter(Intl.NumberFormat, options).format(value);

export const formatDate = (date, options = { day: "2-digit", month: "2-digit", year: "numeric" }) =>
  isEmptyDate(date) ? "—" : getFormatter(Intl.DateTimeFormat, options).format(new Date(date));

export const formatDateTime = (date) =>
  formatDate(date, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const formatTime = (date) => formatDate(date, { hour: "2-digit", minute: "2-digit" });

/** 125 → «2:05» */
export const formatDuration = (seconds) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** «Сегодня» → время, «вчера» → подпись, иначе дата — для списков чатов и сообщений */
export function formatRelativeDay(date, yesterdayLabel) {
  if (isEmptyDate(date)) return "";
  const d = new Date(date);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return formatTime(d);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return yesterdayLabel;
  return formatDate(d, { day: "2-digit", month: "2-digit" });
}
