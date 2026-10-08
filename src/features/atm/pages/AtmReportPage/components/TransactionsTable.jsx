/**
 * Таблица операций выписки: поиск по любому полю, сортировка по колонкам, банк карты по BIN.
 * Используется только в AtmReportPage.
 */
import { useMemo, useState } from "react";
import { CircleAlert, CircleCheck, CircleX, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { formatDate, formatNumber, formatTime } from "@/shared/lib/format";
import { EmptyState } from "@/shared/ui";

const STATUS = {
  success: { color: "success", icon: CircleCheck },
  reversed: { color: "error", icon: CircleX },
  priority: { color: "error", icon: CircleAlert },
  error: { color: "error", icon: CircleX },
};

/** Значение для сортировки по колонке */
const SORT_VALUE = {
  id: (r) => r.id,
  bank: (r) => r.banks.join(", "),
  atm: (r) => r.atmId,
  utrnno: (r) => r.utrnno,
  status: (r) => r.status.key,
  amount: (r) => r.amount,
  date: (r) => r.ts ?? 0,
};

function compare(a, b) {
  const na = Number(a);
  const nb = Number(b);
  if (a !== "" && b !== "" && Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return String(a ?? "").localeCompare(String(b ?? ""), "ru", { numeric: true, sensitivity: "base" });
}

export function TransactionsTable({ transactions }) {
  const { t } = useTranslation("atm");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "date", dir: "desc" });

  const statusLabel = (s) => (s.key === "error" ? s.text || t("tx.status.error") : t(`tx.status.${s.key}`));

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? transactions.filter((r) =>
          [r.id, ...r.banks, r.bin6, r.atmId, r.utrnno, r.rrn, statusLabel(r.status), r.type, r.address, r.amount, r.ts && formatDate(r.ts)]
            .join(" | ")
            .toLowerCase()
            .includes(q),
        )
      : transactions;
    const mul = sort.dir === "asc" ? 1 : -1;
    const value = SORT_VALUE[sort.key];
    return [...filtered].sort((a, b) => (compare(value(a), value(b)) || compare(a.id, b.id)) * mul);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- statusLabel зависит только от языка (t)
  }, [transactions, query, sort, t]);

  const onSort = (key) => setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const head = (key, label, align) => (
    <TableCell align={align} sortDirection={sort.key === key ? sort.dir : false}>
      <TableSortLabel active={sort.key === key} direction={sort.key === key ? sort.dir : "asc"} onClick={() => onSort(key)}>
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="font-bold">
          {t("tx.title")} <span className="font-medium text-fg-muted">· {rows.length}</span>
        </div>
        <TextField
          placeholder={t("tx.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ width: 360 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search className="size-4" />
                </InputAdornment>
              ),
            },
          }}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState title={t(transactions.length ? "notFound" : "tx.empty")} />
      ) : (
        <TableContainer sx={{ maxHeight: "70vh" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {head("id", "ID")}
                {head("bank", t("tx.columns.bank"))}
                {head("atm", t("tx.columns.atm"))}
                {head("utrnno", "UTRNNO")}
                {head("status", t("tx.columns.status"))}
                <TableCell>{t("tx.columns.type")}</TableCell>
                {head("amount", t("tx.columns.amount"), "right")}
                {head("date", t("tx.columns.date"))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => {
                const status = STATUS[r.status.key];
                const StatusIcon = status.icon;
                return (
                  <TableRow key={r.rowId} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{r.id ?? "—"}</TableCell>
                    <TableCell>
                      {r.banks.length === 0 && <div className="text-fg-muted">{t("tx.unknownBank")}</div>}
                      {/* Один банк — крупно; несколько кандидатов — компактным списком в одну строку каждый */}
                      {r.banks.map((bank) => (
                        <div
                          key={bank}
                          className={r.banks.length > 1 ? "text-xs leading-5 whitespace-nowrap" : "font-semibold"}
                        >
                          {bank}
                        </div>
                      ))}
                      {r.bin6 && (
                        <div className="text-xs whitespace-nowrap text-fg-muted">
                          BIN {r.bin6}
                          {r.banks.length > 1 && ` · ${t("tx.ambiguousBin")}`}
                        </div>
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{r.atmId || "—"}</TableCell>
                    <TableCell sx={{ wordBreak: "break-all" }}>{r.utrnno || "—"}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        color={status.color}
                        icon={<StatusIcon className="size-3.5" />}
                        label={statusLabel(r.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={r.address}>
                        <span className="block max-w-64 truncate">{r.type || "—"}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                      {formatNumber(r.amount, { maximumFractionDigits: 2 })} {r.currency}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {r.ts ? (
                        <>
                          <div>{formatDate(r.ts)}</div>
                          <div className="text-xs text-fg-muted">{formatTime(r.ts)}</div>
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
}
