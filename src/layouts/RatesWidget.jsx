/**
 * Виджет курсов валют НБТ внизу бокового меню (Sidebar).
 */
import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import Tooltip from "@mui/material/Tooltip";
import { RATE_CODES, useGetNbtRatesQuery } from "@/shared/api/rates";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatNumber } from "@/shared/lib/format";

const placeholder = RATE_CODES.map((code) => ({ code }));
const fmt = (value, options) => formatNumber(value, { minimumFractionDigits: 4, maximumFractionDigits: 4, ...options });

/** Курсы Нацбанка Таджикистана в боковом меню */
export function RatesWidget({ collapsed }) {
  const { t } = useTranslation();
  const { data, isFetching, isError, refetch } = useGetNbtRatesQuery();

  if (collapsed) return null;

  return (
    <div className="rounded-2xl bg-linear-to-br from-brand-600 to-brand-800 p-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold">{t("rates.title")}</div>
          <div className="text-[11px] text-white/60">
            {data ? t("rates.asOf", { date: formatDate(data.date) }) : t("rates.subtitle")}
          </div>
        </div>
        <button
          onClick={refetch}
          disabled={isFetching}
          className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white"
          aria-label={t("rates.refresh")}
        >
          <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
        </button>
      </div>

      <ul className="mt-3 space-y-1.5">
        {isError && !data ? (
          <li className="py-1 text-xs text-white/80">{t("rates.error")}</li>
        ) : (
          (data?.rates ?? placeholder).map((r) => (
            <li key={r.code} className="flex items-center gap-2.5 rounded-xl bg-white/10 px-2.5 py-2">
              <span className="w-8 text-xs font-bold text-white/80">{r.code}</span>
              {r.value === undefined ? (
                <span className="ml-auto h-3.5 w-16 animate-pulse rounded bg-white/20" />
              ) : (
                <>
                  <span className="ml-auto text-sm font-bold tabular-nums">{fmt(r.value)}</span>
                  <Change value={r.change} />
                </>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function Change({ value }) {
  const { t } = useTranslation();
  const up = value > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const text = fmt(value, { signDisplay: "exceptZero" });

  return (
    <Tooltip title={t("rates.changeHint", { change: text })} placement="right">
      <span
        className={cn(
          "flex w-16 items-center justify-end gap-0.5 text-[10px] font-semibold tabular-nums",
          up ? "text-emerald-200" : "text-white/60",
        )}
      >
        {value !== 0 && <Icon className="size-3" />}
        {text}
      </span>
    </Tooltip>
  );
}
