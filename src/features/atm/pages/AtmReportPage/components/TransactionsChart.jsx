/**
 * График операций банкомата: сумма выдач по дням (если период — один день, то по часам); сверху сводка.
 * Учитываются только успешные выдачи: отменённые и неуспешные исключены. Используется только в AtmReportPage.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Card from "@mui/material/Card";
import { dayKey } from "@/features/atm/model/transactions";
import { formatDate, formatNumber } from "@/shared/lib/format";

const BRAND = "#e31e24";

/** Самое частое непустое значение — адрес банкомата из адресов операций */
function mostFrequent(values) {
  const counts = new Map();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

/** Успешные выдачи без дублей (одна и та же операция может прийти дважды), по времени */
function uniqueDispensed(transactions) {
  const seen = new Set();
  return transactions
    .filter((tx) => tx.ts && tx.amount > 0 && tx.dispensed)
    .filter((tx) => {
      const key = `${tx.ts}|${tx.amount}|${tx.rrn}|${tx.stan}|${tx.atmId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.ts - b.ts);
}

/** Столбики: { label, sum, count } по дням или по часам */
function groupBars(list, byHour) {
  const bars = new Map();
  for (const tx of list) {
    const key = byHour ? new Date(tx.ts).getHours() : dayKey(tx.ts);
    const bar = bars.get(key) ?? {
      label: byHour ? `${String(key).padStart(2, "0")}:00` : formatDate(tx.ts, { day: "2-digit", month: "2-digit" }),
      sum: 0,
      count: 0,
    };
    bar.sum += tx.amount;
    bar.count += 1;
    bars.set(key, bar);
  }
  return [...bars.values()];
}

function ChartTooltip({ active, payload }) {
  const { t } = useTranslation("atm");
  const p = active && payload?.[0]?.payload;
  if (!p) return null;
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2 text-sm shadow-card">
      <div className="font-bold">{p.label}</div>
      <div>
        {t("chart.amount")}: <b>{formatNumber(Math.round(p.sum))}</b> TJS
      </div>
      <div className="text-fg-muted">{t("chart.count", { value: p.count })}</div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-muted px-3 py-2">
      <div className="text-xs text-fg-muted">{label}</div>
      <div className="font-bold tabular-nums">{value}</div>
    </div>
  );
}

export function TransactionsChart({ transactions }) {
  const { t } = useTranslation("atm");

  const { bars, total, sum, avg, perDay, address } = useMemo(() => {
    const list = uniqueDispensed(transactions);
    const dayCount = new Set(list.map((tx) => dayKey(tx.ts))).size;
    const sum = list.reduce((s, tx) => s + tx.amount, 0);
    return {
      bars: groupBars(list, dayCount === 1),
      total: list.length,
      sum,
      avg: list.length ? Math.round(sum / list.length) : 0,
      perDay: dayCount ? Math.round(list.length / dayCount) : 0,
      address: mostFrequent(transactions.map((tx) => tx.address)),
    };
  }, [transactions]);

  return (
    <Card sx={{ p: 2.5 }} className="mb-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold">{t("chart.title")}</div>
          {address && <div className="text-sm text-fg-muted">{address}</div>}
          <div className="text-xs text-fg-muted">{t("chart.hint")}</div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label={t("chart.opsLabel")} value={formatNumber(total)} />
          <Stat label={t("chart.sumLabel")} value={`${formatNumber(Math.round(sum))} TJS`} />
          <Stat label={t("chart.avgLabel")} value={`${formatNumber(avg)} TJS`} />
          <Stat label={t("chart.perDayLabel")} value={formatNumber(perDay)} />
        </div>
      </div>

      {bars.length === 0 ? (
        <div className="grid h-40 place-items-center text-sm text-fg-muted">{t("chart.empty")}</div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-line)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--color-fg-muted)" }}
                interval="preserveStartEnd"
              />
              <YAxis
                width={70}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--color-fg-muted)" }}
                tickFormatter={(v) => formatNumber(v)}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)" }} />
              <Bar dataKey="sum" fill={BRAND} radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
