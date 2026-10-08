/**
 * График операций банкомата: каждый столбик — одна выдача, пунктир — начало нового дня; сверху сводка.
 * Учитываются только успешные выдачи: отменённые и неуспешные исключены. Используется только в AtmReportPage.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import { dayKey } from "@/features/atm/model/transactions";
import { formatDate, formatDateTime, formatNumber } from "@/shared/lib/format";

const BRAND = "#e31e24";

/** Самое частое непустое значение — адрес банкомата из адресов операций */
function mostFrequent(values) {
  const counts = new Map();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

function ChartTooltip({ active, payload }) {
  const { t } = useTranslation("atm");
  const p = active && payload?.[0]?.payload;
  if (!p) return null;
  return (
    <div className="min-w-56 rounded-xl border border-line bg-card p-3 text-sm shadow-card">
      <div className="font-bold">{formatDateTime(p.ts)}</div>
      <div className="mt-1">
        {t("chart.amount")}: <b>{formatNumber(Math.round(p.amount))}</b> {p.currency}
      </div>
      {p.rrn && <div className="text-fg-muted">RRN: {p.rrn}</div>}
      {p.stan && <div className="text-fg-muted">STAN: {p.stan}</div>}
    </div>
  );
}

export function TransactionsChart({ transactions }) {
  const { t } = useTranslation("atm");

  const { data, days, total, sum, avg, perDay, address } = useMemo(() => {
    const seen = new Set();
    const data = transactions
      .filter((tx) => tx.ts && tx.amount > 0 && tx.dispensed)
      .sort((a, b) => a.ts - b.ts)
      // одна и та же операция может прийти дважды
      .filter((tx) => {
        const key = `${tx.ts}|${tx.amount}|${tx.rrn}|${tx.stan}|${tx.atmId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((tx, i) => ({ ...tx, x: String(i), day: dayKey(tx.ts) }));

    const days = data.filter((d, i) => i === 0 || d.day !== data[i - 1].day);
    const sum = data.reduce((s, d) => s + d.amount, 0);
    return {
      data,
      days,
      total: data.length,
      sum,
      avg: data.length ? Math.round(sum / data.length) : 0,
      perDay: days.length ? Math.round(data.length / days.length) : 0,
      address: mostFrequent(transactions.map((tx) => tx.address)),
    };
  }, [transactions]);

  return (
    <Card sx={{ p: 2.5 }} className="mb-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-bold">{t("chart.title")}</div>
          {address && <div className="text-sm text-fg-muted">{address}</div>}
          <div className="text-xs text-fg-muted">{t("chart.hint")}</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip size="small" label={t("chart.count", { value: total })} />
          <Chip size="small" label={t("chart.sum", { value: formatNumber(Math.round(sum)) })} />
          <Chip size="small" label={t("chart.avg", { value: formatNumber(avg) })} />
          <Chip size="small" label={t("chart.perDay", { value: perDay })} />
        </div>
      </div>

      {data.length === 0 ? (
        <div className="grid h-40 place-items-center text-sm text-fg-muted">{t("chart.empty")}</div>
      ) : (
        <div className="h-90">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
              <XAxis dataKey="x" hide />
              <YAxis width={70} tick={{ fontSize: 11, fill: "var(--color-fg-muted)" }} tickFormatter={(v) => formatNumber(v)} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)" }} />
              {days.map((d) => (
                <ReferenceLine
                  key={d.day}
                  x={d.x}
                  stroke={BRAND}
                  strokeOpacity={0.5}
                  strokeDasharray="4 4"
                  label={{ value: formatDate(d.ts, { day: "2-digit", month: "2-digit" }), position: "insideTopLeft", fontSize: 11, fill: BRAND }}
                />
              ))}
              <Bar dataKey="amount" fill={BRAND} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
