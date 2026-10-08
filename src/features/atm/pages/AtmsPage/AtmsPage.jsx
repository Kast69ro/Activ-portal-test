/**
 * Мониторинг банкоматов: сводка, поиск, таблица с кассетами, остатками, ошибками и предупреждениями, экспорт в Excel.
 * Маршрут: /atm. Доступ: Admin.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, Banknote, CircleAlert, FileSpreadsheet, FileText, RefreshCw, Search, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { useGetAtmsQuery } from "@/features/atm/api";
import { StatementDialog } from "@/features/atm/components/StatementDialog";
import { CASSETTES, translateIssue } from "@/features/atm/model/atm";
import { exportWorkbook } from "@/shared/lib/excel";
import { formatNumber, formatTime } from "@/shared/lib/format";
import { EmptyState, PageHeader, QueryState, StatCard, useToast } from "@/shared/ui";
import { AtmMap } from "./components/AtmMap";

/** Сначала банкоматы с ошибками, затем с предупреждениями — их нужно увидеть первыми */
const severity = (a) => (a.errors.length ? 2 : a.warnings.length ? 1 : 0);

export default function AtmsPage() {
  const { t } = useTranslation("atm");
  const atmsQuery = useGetAtmsQuery();
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  // Банкомат, для которого выбирают период выписки
  const [statementAtm, setStatementAtm] = useState(null);

  const atms = useMemo(() => atmsQuery.data ?? [], [atmsQuery.data]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return atms
      .filter((a) => !q || [a.id, a.name, a.address, a.region].some((v) => String(v).toLowerCase().includes(q)))
      .sort((a, b) => severity(b) - severity(a));
  }, [atms, search]);

  const stats = useMemo(
    () => ({
      total: atms.length,
      errors: atms.filter((a) => a.errors.length > 0).length,
      warnings: atms.filter((a) => a.warnings.length > 0).length,
      tjs: atms.reduce((sum, a) => sum + a.balanceTjs, 0),
    }),
    [atms],
  );

  /** Выгружает строки, видимые в таблице (с учётом поиска): каждая кассета — отдельная колонка */
  const exportExcel = async () => {
    setExporting(true);
    try {
      await exportWorkbook("atms", [
        {
          name: t("excel.sheet"),
          title: atmsQuery.fulfilledTimeStamp
            ? `${t("title")} — ${t("updatedAt", { time: formatTime(atmsQuery.fulfilledTimeStamp) })}`
            : t("title"),
          columns: [
            { header: t("columns.id"), width: 12 },
            { header: t("excel.name"), width: 26 },
            { header: t("excel.address"), width: 36 },
            { header: t("columns.state"), width: 16 },
            ...CASSETTES.map(([currency, denomination]) => ({ header: `${denomination} ${currency}`, width: 10 })),
            { header: t("excel.balanceTjs"), width: 16 },
            { header: t("excel.balanceUsd"), width: 16 },
            { header: t("columns.errors"), width: 40 },
            { header: t("columns.warnings"), width: 40 },
          ],
          rows: rows.map((a) => [
            a.id,
            a.name,
            [a.region, a.address].filter(Boolean).join(", "),
            a.state,
            ...a.cassettes.map((c) => c.count),
            a.balanceTjs,
            a.balanceUsd,
            a.errors.map((x) => translateIssue(x, "error")).join("\n"),
            a.warnings.map((x) => translateIssue(x, "warning")).join("\n"),
          ]),
        },
      ]);
      toast.success(t("exportDone"));
    } catch {
      toast.error(t("exportFailed"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        description={
          atmsQuery.fulfilledTimeStamp
            ? t("updatedAt", { time: formatTime(atmsQuery.fulfilledTimeStamp) })
            : t("subtitle")
        }
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<RefreshCw className="size-4" />}
              loading={atmsQuery.isFetching}
              loadingPosition="start"
              onClick={atmsQuery.refetch}
            >
              {t("refresh")}
            </Button>
            <Button
              variant="contained"
              startIcon={<FileSpreadsheet className="size-4" />}
              loading={exporting}
              loadingPosition="start"
              disabled={!rows.length}
              onClick={exportExcel}
            >
              {t("export")}
            </Button>
          </>
        }
      />

      {/* Карта строится по статическому списку адресов — показываем её, даже если сервис недоступен */}
      <AtmMap />

      <QueryState query={atmsQuery}>
        {() => (
          <>
            <div className="mb-6 grid grid-cols-4 gap-4">
              <StatCard label={t("stats.total")} value={stats.total} icon={Banknote} />
              <StatCard label={t("stats.errors")} value={stats.errors} icon={CircleAlert} tone="brand" />
              <StatCard label={t("stats.warnings")} value={stats.warnings} icon={TriangleAlert} tone="warning" />
              <StatCard label={t("stats.balanceTjs")} value={`${formatNumber(stats.tjs)} TJS`} icon={Banknote} tone="success" />
            </div>

            <Card>
              <div className="flex flex-wrap items-center gap-3 p-4">
                <TextField
                  placeholder={t("search")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ width: 320 }}
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
                <EmptyState title={t(atms.length ? "notFound" : "empty")} />
              ) : (
                <TableContainer sx={{ maxHeight: "70vh" }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t("columns.id")}</TableCell>
                        <TableCell>{t("columns.atm")}</TableCell>
                        <TableCell>{t("columns.state")}</TableCell>
                        <TableCell>{t("columns.cassettes")}</TableCell>
                        <TableCell align="right">{t("columns.balance")}</TableCell>
                        <TableCell>{t("columns.errors")}</TableCell>
                        <TableCell>{t("columns.warnings")}</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((a) => (
                        <TableRow key={a.id} hover>
                          <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>{a.id}</TableCell>
                          <TableCell sx={{ minWidth: 180 }}>
                            <div className="font-semibold">{a.name || "—"}</div>
                            <div className="text-xs text-fg-muted">
                              {[a.region, a.address].filter(Boolean).join(", ") || "—"}
                            </div>
                          </TableCell>
                          <TableCell>{a.state ? <Chip size="small" variant="outlined" label={a.state} /> : "—"}</TableCell>
                          <TableCell>
                            <Cassettes cassettes={a.cassettes} />
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                            <div className="font-bold tabular-nums">{formatNumber(a.balanceTjs)} TJS</div>
                            {a.balanceUsd > 0 && (
                              <div className="text-xs text-fg-muted tabular-nums">{formatNumber(a.balanceUsd)} USD</div>
                            )}
                          </TableCell>
                          <TableCell sx={{ minWidth: 150, maxWidth: 200 }}>
                            <Issues items={a.errors} kind="error" />
                          </TableCell>
                          <TableCell sx={{ minWidth: 130, maxWidth: 180 }}>
                            <Issues items={a.warnings} kind="warning" />
                          </TableCell>
                          <TableCell padding="none" sx={{ pr: 1 }}>
                            <Tooltip title={t("statement.open")}>
                              <IconButton size="small" aria-label={t("statement.open")} onClick={() => setStatementAtm(a.id)}>
                                <FileText className="size-4" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          </>
        )}
      </QueryState>

      <StatementDialog
        open={Boolean(statementAtm)}
        atmId={statementAtm}
        onClose={() => setStatementAtm(null)}
        onSubmit={({ fromDate, toDate }) =>
          navigate(`/atm/${encodeURIComponent(statementAtm)}/report?from=${fromDate}&to=${toDate}`)
        }
      />
    </>
  );
}

/** Количество купюр по кассетам: «200 × 12». Пустые кассеты подсвечены */
function Cassettes({ cassettes }) {
  return (
    <div className="grid grid-cols-[repeat(3,max-content)] gap-x-4 gap-y-0.5 text-xs whitespace-nowrap tabular-nums">
      {cassettes.map((c) => (
        <span key={`${c.currency}${c.denomination}`} className={c.count === 0 ? "text-brand-600" : undefined}>
          <span className="text-fg-muted">
            {c.denomination}
            {c.currency === "USD" ? "$" : ""} ×
          </span>{" "}
          <b>{c.count}</b>
        </span>
      ))}
    </div>
  );
}

/** Ошибки (красные) и предупреждения (жёлтые) по-русски, исходный текст — в подсказке */
function Issues({ items, kind }) {
  if (!items.length) return <span className="text-fg-muted">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((text, i) => (
        <Tooltip key={i} title={text}>
          <Chip
            size="small"
            color={kind === "error" ? "error" : "warning"}
            variant="outlined"
            icon={kind === "error" ? <CircleAlert className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
            label={translateIssue(text, kind)}
            // Длинный текст переносится внутри чипа, а не растягивает таблицу
            sx={{ height: "auto", maxWidth: "100%", "& .MuiChip-label": { whiteSpace: "normal", py: 0.25 } }}
          />
        </Tooltip>
      ))}
    </div>
  );
}
