/**
 * Модель банкомата: ответ сервиса мониторинга (TID, ATMState, info, Dispenser, Errors, Warnings)
 * приводится к плоскому виду для таблицы. Используется в api.js и на странице AtmsPage.
 */
import { ATM_ERRORS_RU, ATM_WARNINGS_RU } from "./atmIssues";

/** Кассеты, которые показываются в таблице: [валюта, номинал] */
export const CASSETTES = [
  ["TJS", 200],
  ["TJS", 100],
  ["TJS", 50],
  ["TJS", 20],
  ["TJS", 10],
  ["USD", 100],
];

const normalizeKey = (s) => String(s ?? "").trim().replace(/\s+/g, " ");

/** Текст ошибки/предупреждения: строка, число или объект { message | text | code } */
function issueText(x) {
  if (x == null) return "";
  if (typeof x === "string" || typeof x === "number") return normalizeKey(x);
  return normalizeKey(x.message ?? x.text ?? x.code ?? "");
}

/** Ошибка или предупреждение по-русски; неизвестные коды — как пришли */
export const translateIssue = (text, kind) => (kind === "error" ? ATM_ERRORS_RU : ATM_WARNINGS_RU)[text] || text;

const banknotes = (disp, currency, denomination) =>
  disp.find((d) => d.currency === currency && d.denomination === denomination)?.currentBanknotes ?? 0;

const balance = (disp, currency) =>
  disp
    .filter((d) => d.currency === currency)
    .reduce((sum, d) => sum + (d.currentBanknotes ?? 0) * (d.denomination ?? 0), 0);

/** Банкомат из ответа сервиса → строка таблицы */
export function toAtm(raw) {
  const disp = Array.isArray(raw?.Dispenser) ? raw.Dispenser : [];
  const info = raw?.info ?? {};
  const warnings = Array.isArray(raw?.Warnings) ? raw.Warnings : Array.isArray(raw?.Warning) ? raw.Warning : [];

  return {
    id: raw?.TID ?? "—",
    state: raw?.ATMState ?? "",
    name: info.name ?? "",
    region: info.region ?? "",
    address: info.address ?? "",
    cassettes: CASSETTES.map(([currency, denomination]) => ({
      currency,
      denomination,
      count: banknotes(disp, currency, denomination),
    })),
    balanceTjs: balance(disp, "TJS"),
    balanceUsd: balance(disp, "USD"),
    errors: (Array.isArray(raw?.Errors) ? raw.Errors : []).map(issueText).filter(Boolean),
    warnings: warnings.map(issueText).filter(Boolean),
  };
}
