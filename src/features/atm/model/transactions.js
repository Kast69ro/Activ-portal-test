/**
 * Модель операции по банкомату (сервис транзакций, /Transactions/by-atm): дата, сумма, статус, банк карты.
 * Используется в api.js и на странице выписки (AtmReportPage: график и таблица).
 */
import { banksByCard, bin6Of } from "./binBanks";

/** Код валюты ISO 4217 → обозначение */
const CURRENCIES = { 972: "TJS", 840: "USD", 643: "RUB", 978: "EUR" };

/**
 * Сумма операции. Иногда приходит в дирамах: целое ≥ 1000, кратное 100, делится на 100.
 * Эвристика перенесена из прежнего проекта как есть.
 */
export function normalizeAmount(raw) {
  const v = Number(raw);
  if (!Number.isFinite(v)) return 0;
  return v >= 1000 && v % 100 === 0 ? v / 100 : v;
}

/** localTransactionDate + localTransactionTime → timestamp (мс) или null */
function txTimestamp(t) {
  const date = String(t.localTransactionDate || "").slice(0, 10);
  const time = String(t.localTransactionTime || "00:00:00").slice(0, 8);
  if (!date) return null;
  const ts = new Date(`${date}T${time}`).getTime();
  return Number.isFinite(ts) ? ts : null;
}

/** Статус операции: reversed | success | priority | error (для error — текст ответа процессинга) */
function txStatus(t) {
  const desc = String(t.responseDescription || "").toLowerCase();
  const code = String(t.responseCode ?? "");
  if (Number(t.reversal) === 1) return { key: "reversed" };
  if (desc.includes("успеш") || code === "0" || code === "-1") return { key: "success" };
  if (desc.includes("приоритет") || desc.includes("высок")) return { key: "priority" };
  return { key: "error", text: t.responseDescription || "" };
}

/** Операция из ответа сервиса → строка выписки */
export function toTransaction(t, index) {
  const ts = txTimestamp(t);
  const status = txStatus(t);
  return {
    rowId: String(t.id ?? `${t.utrnno ?? ""}-${t.terminalId ?? ""}-${index}`),
    id: t.id,
    ts,
    // Несколько банков — BIN неоднозначен по первым 6 цифрам
    banks: banksByCard(t.cardNumber),
    bin6: bin6Of(t.cardNumber),
    atmId: t.atmId || t.terminalId || t.terminal || "",
    utrnno: t.utrnno ?? "",
    rrn: t.rrn || "",
    stan: t.stan || "",
    status,
    // Деньги выданы: операция успешна и не отменена — только такие идут в график и сводку
    dispensed: status.key === "success",
    amount: normalizeAmount(t.amount),
    currency: CURRENCIES[t.currency] ?? (t.currency ? String(t.currency) : ""),
    type: t.transactionTypeName || "",
    address: t.terminalAddress || "",
  };
}

/** Начало дня: «2026-10-07» */
export const dayKey = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Сегодня в формате поля date: «2026-10-07» */
export const today = () => dayKey(Date.now());
