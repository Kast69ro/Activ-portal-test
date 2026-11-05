/**
 * Мониторинг банкоматов: сводка, поиск, таблица с купюрами по номиналам, остатком, оборотом за вчера,
 * ошибками и предупреждениями, экспорт в Excel.
 * Маршрут: /atm. Доступ: Admin.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  Banknote,
  CircleAlert,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Search,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
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
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { useGetAtmsHistoryQuery, useGetAtmsQuery } from "@/features/atm/api";
import { StatementDialog } from "@/features/atm/components/StatementDialog";
import { CASSETTES, translateIssue } from "@/features/atm/model/atm";
import { dispensedByAtm, today, yesterday } from "@/features/atm/model/transactions";
import { exportWorkbook } from "@/shared/lib/excel";
import { formatNumber, formatTime } from "@/shared/lib/format";
import { EmptyState, PageHeader, QueryState, StatCard, useToast } from "@/shared/ui";
import { AtmMap } from "./components/AtmMap";

/** Сначала банкоматы с ошибками, затем с предупреждениями — их нужно увидеть первыми */
const severity = (a) => (a.errors.length ? 2 : a.warnings.length ? 1 : 0);

/** Сравнение по колонке; без сортировки — по серьёзности проблем */
const COMPARE = {
  id: (a, b) => String(a.id).localeCompare(String(b.id), "ru", { numeric: true }),
  balance: (a, b) => a.balanceTjs - b.balanceTjs,
  turnover: (a, b) => (a.turnover ?? -1) - (b.turnover ?? -1),
  issues: (a, b) => severity(a) - severity(b) || a.errors.length + a.warnings.length - b.errors.length - b.warnings.length,
};

/** Шапка таблицы прилипает целиком — обе строки (группа «Количество купюр» и номиналы) */
const headCellSx = {
  bgcolor: "background.paper",
  fontWeight: 700,
  fontSize: 12,
  color: "text.secondary",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  whiteSpace: "nowrap",
};

/** Колонки номиналов выделены фоном и границами, чтобы читались как одна группа */
const denomCellSx = (first, last) => ({
  bgcolor: "action.hover",
  textAlign: "center",
  px: 1,
  ...(first && { borderLeft: 1, borderLeftColor: "divider" }),
  ...(last && { borderRight: 1, borderRightColor: "divider" }),
});
const denomSx = (i) => denomCellSx(i === 0, i === CASSETTES.length - 1);

export default function AtmsPage() {
  const { t } = useTranslation("atm");
  const atmsQuery = useGetAtmsQuery();
  const turnoverDay = yesterday();
  const historyQuery = useGetAtmsHistoryQuery({ fromDate: turnoverDay, toDate: today() });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: null, dir: "desc" });
  const [exporting, setExporting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  // Банкомат, для которого выбирают период выписки
  const [statementAtm, setStatementAtm] = useState(null);

  // Оборот за вчера; пока история не загружена (или не загрузилась) — null, в таблице «—»
  const turnovers = useMemo(
    () => (historyQuery.data ? dispensedByAtm(historyQuery.data, turnoverDay) : null),
    [historyQuery.data, turnoverDay],
  );

  const atms = useMemo(
    () =>
      (atmsQuery.data ?? []).map((a) => ({
        ...a,
        turnover: turnovers ? (turnovers.get(String(a.id)) ?? 0) : null,
      })),
    [atmsQuery.data, turnovers],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const compare = sort.key
      ? (a, b) => COMPARE[sort.key](a, b) * (sort.dir === "asc" ? 1 : -1)
      : (a, b) => severity(b) - severity(a);
    return atms
      .filter((a) => !q || [a.id, a.name, a.address, a.region].some((v) => String(v).toLowerCase().includes(q)))
      .sort((a, b) => compare(a, b) || COMPARE.id(a, b));
  }, [atms, search, sort]);

  const stats = useMemo(
    () => ({
      total: atms.length,
      errors: atms.filter((a) => a.errors.length > 0).length,
      warnings: atms.filter((a) => a.warnings.length > 0).length,
      tjs: atms.reduce((sum, a) => sum + a.balanceTjs, 0),
      turnover: turnovers ? atms.reduce((sum, a) => sum + (a.turnover ?? 0), 0) : null,
    }),
    [atms, turnovers],
  );

  /** Убывание → возрастание → без сортировки */
  const toggleSort = (key) =>
    setSort((prev) =>
      prev.key !== key ? { key, dir: "desc" } : prev.dir === "desc" ? { key, dir: "asc" } : { key: null, dir: "desc" },
    );

  const sortLabel = (key, label) => (
    <TableSortLabel active={sort.key === key} direction={sort.key === key ? sort.dir : "desc"} onClick={() => toggleSort(key)}>
      {label}
    </TableSortLabel>
  );

  /** Выгружает строки, видимые в таблице (с учётом поиска и сортировки): каждая кассета — отдельная колонка */
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
            { header: t("excel.turnover"), width: 18 },
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
            a.turnover ?? "",
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

  const refresh = () => {
    atmsQuery.refetch();
    historyQuery.refetch();
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
              loading={atmsQuery.isFetching || historyQuery.isFetching}
              loadingPosition="start"
              onClick={refresh}
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
            <div className="mb-6 grid grid-cols-5 gap-4">
              <StatCard label={t("stats.total")} value={stats.total} icon={Banknote} tone="info" />
              <StatCard label={t("stats.errors")} value={stats.errors} icon={CircleAlert} tone="brand" />
              <StatCard label={t("stats.warnings")} value={stats.warnings} icon={TriangleAlert} tone="warning" />
              <StatCard label={t("stats.balanceTjs")} value={`${formatNumber(stats.tjs)} TJS`} icon={Banknote} tone="success" />
              <StatCard
                label={t("stats.turnover")}
                value={stats.turnover == null ? "—" : `${formatNumber(stats.turnover)} TJS`}
                hint={historyQuery.isError ? t("turnoverFailed") : undefined}
                icon={TrendingUp}
                tone="info"
              />
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
                <TableContainer sx={{ maxHeight: "70vh", borderTop: 1, borderColor: "divider" }}>
                  <Table size="small" sx={{ "& td, & th": { borderColor: "divider" } }}>
                    <TableHead sx={{ position: "sticky", top: 0, zIndex: 2, "& th": headCellSx }}>
                      <TableRow>
                        <TableCell rowSpan={2}>{sortLabel("id", t("columns.id"))}</TableCell>
                        <TableCell rowSpan={2}>{t("columns.atm")}</TableCell>
                        <TableCell rowSpan={2}>{t("columns.state")}</TableCell>
                        <TableCell colSpan={CASSETTES.length} align="center" sx={denomCellSx(true, true)}>
                          {t("columns.banknotes")}
                        </TableCell>
                        <TableCell rowSpan={2} align="right">
                          {sortLabel("balance", t("columns.balance"))}
                        </TableCell>
                        <TableCell rowSpan={2} align="right">
                          {sortLabel("turnover", t("columns.turnover"))}
                        </TableCell>
                        <TableCell rowSpan={2}>{sortLabel("issues", t("columns.errors"))}</TableCell>
                        <TableCell rowSpan={2}>{t("columns.warnings")}</TableCell>
                        <TableCell rowSpan={2} />
                      </TableRow>
                      <TableRow>
                        {CASSETTES.map(([currency, denomination], i) => (
                          <TableCell key={`${currency}${denomination}`} sx={denomSx(i)}>
                            {denomination}
                            <span className="ml-1 font-medium opacity-70">{currency}</span>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((a) => (
                        <TableRow key={a.id} hover>
                          <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>{a.id}</TableCell>
                          <TableCell sx={{ minWidth: 200 }}>
                            <div className="font-semibold">{a.name || "—"}</div>
                            <div className="text-xs text-fg-muted">
                              {[a.region, a.address].filter(Boolean).join(", ") || "—"}
                            </div>
                          </TableCell>
                          <TableCell>{a.state ? <Chip size="small" variant="outlined" label={a.state} /> : "—"}</TableCell>
                          {a.cassettes.map((c, i) => (
                            <TableCell
                              key={`${c.currency}${c.denomination}`}
                              sx={{ ...denomSx(i), fontVariantNumeric: "tabular-nums" }}
                            >
                              {/* Пустая кассета — красным */}
                              <span className={c.count === 0 ? "font-bold text-brand-600" : "font-semibold"}>{c.count}</span>
                            </TableCell>
                          ))}
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                            <div className="font-bold tabular-nums">{formatNumber(a.balanceTjs)} TJS</div>
                            {a.balanceUsd > 0 && (
                              <div className="text-xs text-fg-muted tabular-nums">{formatNumber(a.balanceUsd)} USD</div>
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                            {a.turnover == null ? (
                              <span className="text-fg-muted">—</span>
                            ) : (
                              <span className={a.turnover > 0 ? "font-semibold tabular-nums" : "text-fg-muted tabular-nums"}>
                                {formatNumber(a.turnover)} TJS
                              </span>
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

/** Сколько ошибок/предупреждений показывать в ячейке; остальные — в чипе «+N» */
const ISSUES_VISIBLE = 2;

/** Компактный чип: одна строка, лишний текст обрезается многоточием */
const issueChipSx = {
  height: 22,
  maxWidth: "100%",
  fontSize: 12,
  "& .MuiChip-label": { px: 0.75, overflow: "hidden", textOverflow: "ellipsis" },
  "& .MuiChip-icon": { ml: 0.5, mr: -0.25 },
};

/** Ошибки (красные) и предупреждения (жёлтые) по-русски; полный и исходный текст — в подсказке */
function Issues({ items, kind }) {
  if (!items.length) return <span className="text-fg-muted">—</span>;
  const color = kind === "error" ? "error" : "warning";
  const shown = items.slice(0, ISSUES_VISIBLE);
  const hidden = items.slice(ISSUES_VISIBLE);
  return (
    <div className="flex flex-col items-start gap-1">
      {shown.map((text, i) => {
        const label = translateIssue(text, kind);
        return (
          <Tooltip key={i} title={label === text ? text : `${label} (${text})`}>
            <Chip
              size="small"
              color={color}
              variant="outlined"
              icon={kind === "error" ? <CircleAlert className="size-3" /> : <AlertTriangle className="size-3" />}
              label={label}
              sx={issueChipSx}
            />
          </Tooltip>
        );
      })}
      {hidden.length > 0 && (
        <Tooltip
          title={
            <div className="flex flex-col gap-0.5">
              {hidden.map((text, i) => (
                <span key={i}>{translateIssue(text, kind)}</span>
              ))}
            </div>
          }
        >
          <Chip size="small" color={color} label={`+${hidden.length}`} sx={issueChipSx} />
        </Tooltip>
      )}
    </div>
  );
}
