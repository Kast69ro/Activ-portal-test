/** Длительность сессии: бэкенд отдаёт минуты дробным числом (6.5 → «6 мин 30 сек») */
export function formatSessionDuration(minutes, t) {
  if (minutes == null || minutes === "") return "—";
  const total = Math.round(Number(minutes) * 60);
  return t("results.durationValue", { min: Math.floor(total / 60), sec: total % 60 });
}
