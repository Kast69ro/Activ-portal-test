/**
 * Результаты тестов: сессии, фильтры, рейтинг, повторная попытка, выгрузка в Excel.
 * Маршрут: /test-taking. Доступ: Admin.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Award,
  CheckCircle2,
  Crown,
  Download,
  Eye,
  FileSpreadsheet,
  Hourglass,
  ListChecks,
  RotateCcw,
  Search,
  Trophy,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { ALL, employeeFio, findById, useGetDepartmentsQuery, useGetEmployeesQuery } from "@/entities/org/orgApi";
import {
  SESSION_STATUS,
  attemptInfo,
  questionText,
  sessionAnswerText,
  sessionStatus,
  testTitle,
} from "@/entities/testing/model";
import { useGetSessionsQuery, useGetTestsQuery } from "@/entities/testing/testingApi";
import { formatDateTime } from "@/shared/lib/format";
import { EmptyState, PageHeader, QueryState, StatCard, useToast } from "@/shared/ui";
import { SessionDetailsDialog } from "./components/SessionDetailsDialog";
import { RETAKE_DURATION } from "@/features/testing/model/constants";
import { exportWorkbook } from "@/features/testing/model/excel";
import { runUrl } from "@/features/testing/model/runUrl";
import { formatSessionDuration } from "@/features/testing/model/sessionFormat";
import { selectShowRanking, toggleRanking } from "@/features/testing/model/testingSlice";

const RANK_COLORS = ["text-amber-400", "text-slate-400", "text-orange-700"];

export default function TestResultsPage() {
  const { t, i18n } = useTranslation("testing");
  const lang = i18n.language;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const showRanking = useSelector(selectShowRanking);

  const sessionsQuery = useGetSessionsQuery();
  const testsQuery = useGetTestsQuery();
  const { data: employeesData } = useGetEmployeesQuery(ALL);
  const { data: departmentsData } = useGetDepartmentsQuery(ALL);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [details, setDetails] = useState(null);
  const [exporting, setExporting] = useState(false);

  const sessions = useMemo(() => [...(sessionsQuery.data ?? [])].sort((a, b) => b.id - a.id), [sessionsQuery.data]);
  const tests = testsQuery.data ?? [];
  const employees = useMemo(() => employeesData?.items ?? [], [employeesData]);
  const departments = departmentsData?.items ?? [];

  const testOf = (s) => tests.find((x) => String(x.id) === String(s.testId));
  const employeeOf = (s) => findById(employees, s.employeeId);
  const departmentName = (e) => findById(departments, e?.departmentId)?.name ?? "";

  const stats = useMemo(() => {
    const completed = sessions.filter((s) => sessionStatus(s.status) === SESSION_STATUS.COMPLETED);
    const scored = completed.filter((s) => s.score != null);
    return {
      total: sessions.length,
      completed: completed.length,
      inProgress: sessions.filter((s) => sessionStatus(s.status) === SESSION_STATUS.IN_PROGRESS).length,
      average: scored.length ? Math.round(scored.reduce((sum, s) => sum + s.score, 0) / scored.length) : 0,
    };
  }, [sessions]);

  const ranking = useMemo(
    () =>
      employees
        .map((e) => {
          const done = sessions.filter(
            (s) =>
              String(s.employeeId) === String(e.id) &&
              sessionStatus(s.status) === SESSION_STATUS.COMPLETED &&
              s.score != null,
          );
          return {
            employee: e,
            completed: done.length,
            avg: done.length ? Math.round(done.reduce((sum, s) => sum + s.score, 0) / done.length) : 0,
            best: done.length ? Math.max(...done.map((s) => s.score)) : 0,
          };
        })
        .filter((r) => r.completed > 0)
        .sort((a, b) => b.avg - a.avg),
    [employees, sessions],
  );

  const filtered = sessions.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const test = testOf(s);
    return `${employeeFio(employeeOf(s))} ${test ? testTitle(test, lang) : ""}`.toLowerCase().includes(q);
  });

  const exportAll = async () => {
    setExporting(true);
    try {
      await exportWorkbook("test_sessions", [
        {
          name: t("results.excel.summary"),
          title: t("results.excel.reportTitle"),
          columns: [
            { header: t("results.excel.metric"), width: 28 },
            { header: t("results.excel.value"), width: 18 },
          ],
          rows: [
            [t("results.stats.total"), stats.total],
            [t("results.stats.completed"), stats.completed],
            [t("results.stats.inProgress"), stats.inProgress],
            [t("results.stats.average"), `${stats.average}%`],
          ],
        },
        {
          name: t("results.excel.details"),
          columns: [
            { header: "ID", width: 8 },
            { header: t("results.columns.test"), width: 32 },
            { header: t("results.columns.employee"), width: 32 },
            { header: t("common:fields.department"), width: 28 },
            { header: t("common:fields.email"), width: 28 },
            { header: t("common:fields.status"), width: 14 },
            { header: t("results.columns.started"), width: 20 },
            { header: t("results.columns.finished"), width: 20 },
            { header: t("results.columns.duration"), width: 16 },
            { header: t("results.columns.score"), width: 12 },
            { header: t("results.correct"), width: 14 },
          ],
          rows: sessions.map((s) => {
            const e = employeeOf(s);
            const test = testOf(s);
            return [
              s.id,
              test ? testTitle(test, lang) : `#${s.testId}`,
              e ? employeeFio(e) : `#${s.employeeId}`,
              departmentName(e) || "—",
              e?.email ?? "",
              statusLabel(s, t),
              formatDateTime(s.startedAt),
              formatDateTime(s.finishedAt),
              formatSessionDuration(s.durationMinutes, t),
              s.score != null ? `${s.score}%` : "",
              `${s.correctAnswersCount ?? 0} / ${s.totalQuestionsCount ?? 0}`,
            ];
          }),
        },
        ...(showRanking
          ? [
              {
                name: t("results.excel.ranking"),
                title: t("results.ranking"),
                columns: [
                  { header: t("results.rank"), width: 10 },
                  { header: t("results.columns.employee"), width: 32 },
                  { header: t("common:fields.department"), width: 28 },
                  { header: t("results.testsPassed"), width: 16 },
                  { header: t("results.avgScore"), width: 16 },
                  { header: t("results.bestScore"), width: 16 },
                ],
                rows: ranking.map((r, i) => [
                  i + 1,
                  employeeFio(r.employee),
                  departmentName(r.employee) || "—",
                  r.completed,
                  `${r.avg}%`,
                  `${r.best}%`,
                ]),
              },
            ]
          : []),
      ]);
      toast.success(t("results.excel.done"));
    } catch {
      toast.error(t("results.excel.failed"));
    } finally {
      setExporting(false);
    }
  };

  const exportOne = async (s) => {
    const e = employeeOf(s);
    const test = testOf(s);
    try {
      await exportWorkbook(`session_${s.id}`, [
        {
          name: t("results.excel.session"),
          title: t("results.excel.sessionTitle"),
          columns: [
            { header: t("results.excel.metric"), width: 28 },
            { header: t("results.excel.value"), width: 44 },
          ],
          rows: [
            ["ID", s.id],
            [t("results.columns.employee"), e ? employeeFio(e) : `#${s.employeeId}`],
            [t("common:fields.department"), departmentName(e) || "—"],
            [t("common:fields.email"), e?.email ?? "—"],
            [t("results.columns.test"), test ? testTitle(test, lang) : `#${s.testId}`],
            [t("common:fields.status"), statusLabel(s, t)],
            [t("results.columns.started"), formatDateTime(s.startedAt)],
            [t("results.columns.finished"), formatDateTime(s.finishedAt)],
            [t("results.columns.duration"), formatSessionDuration(s.durationMinutes, t)],
            [t("results.columns.score"), s.score != null ? `${s.score}%` : "—"],
            [t("results.correct"), `${s.correctAnswersCount ?? 0} / ${s.totalQuestionsCount ?? 0}`],
          ],
        },
        {
          name: t("results.excel.answers"),
          columns: [
            { header: "№", width: 6 },
            { header: t("results.question"), width: 50 },
            { header: t("results.answer"), width: 40 },
            { header: t("results.result"), width: 18 },
          ],
          rows: (s.answers ?? []).map((a, i) => {
            const q = test?.questions?.find((x) => String(x.id) === String(a.questionId));
            return [
              i + 1,
              q ? questionText(q, lang) : `#${a.questionId}`,
              sessionAnswerText(a, q, lang),
              a.isCorrect == null ? "—" : a.isCorrect ? t("results.right") : t("results.wrong"),
            ];
          }),
        },
      ]);
    } catch {
      toast.error(t("results.excel.failed"));
    }
  };

  return (
    <>
      <PageHeader
        title={t("results.title")}
        description={t("results.subtitle")}
        actions={
          <>
            <FormControlLabel
              control={<Switch checked={showRanking} onChange={() => dispatch(toggleRanking())} />}
              label={t("results.showRanking")}
            />
            <Button
              variant="contained"
              startIcon={<FileSpreadsheet className="size-4" />}
              loading={exporting}
              disabled={!sessions.length}
              onClick={exportAll}
            >
              {t("results.exportAll")}
            </Button>
          </>
        }
      />

      <QueryState queries={[sessionsQuery, testsQuery]}>
        {() => (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-5">
              <StatCard label={t("results.stats.total")} value={stats.total} icon={ListChecks} />
              <StatCard
                label={t("results.stats.completed")}
                value={stats.completed}
                icon={CheckCircle2}
                tone="success"
              />
              <StatCard
                label={t("results.stats.inProgress")}
                value={stats.inProgress}
                icon={Hourglass}
                tone="warning"
              />
              <StatCard label={t("results.stats.average")} value={`${stats.average}%`} icon={Award} tone="info" />
            </div>

            <div className={showRanking ? "grid grid-cols-[1fr_360px] items-start gap-6" : ""}>
              <Card>
                <div className="flex items-center justify-between gap-3 p-4">
                  <TextField
                    placeholder={t("results.search")}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(0);
                    }}
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
                {filtered.length === 0 ? (
                  <EmptyState title={t("results.empty")} />
                ) : (
                  <>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{t("results.columns.employee")}</TableCell>
                          <TableCell>{t("results.columns.test")}</TableCell>
                          <TableCell>{t("common:fields.status")}</TableCell>
                          <TableCell>{t("results.columns.finished")}</TableCell>
                          <TableCell>{t("results.columns.duration")}</TableCell>
                          <TableCell>{t("results.columns.score")}</TableCell>
                          <TableCell align="right" />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((s) => {
                          const e = employeeOf(s);
                          const test = testOf(s);
                          const completed = sessionStatus(s.status) === SESSION_STATUS.COMPLETED;
                          const attempts = attemptInfo(sessions, s.employeeId, s.testId);
                          return (
                            <TableRow key={s.id} hover sx={{ cursor: "pointer" }} onClick={() => setDetails(s)}>
                              <TableCell>
                                <div className="font-semibold">{e ? employeeFio(e) : `#${s.employeeId}`}</div>
                                <div className="text-xs text-fg-muted">{departmentName(e)}</div>
                              </TableCell>
                              <TableCell sx={{ maxWidth: 240 }}>
                                <div className="truncate">{test ? testTitle(test, lang) : `#${s.testId}`}</div>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  color={completed ? "success" : "warning"}
                                  label={statusLabel(s, t)}
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(s.finishedAt)}</TableCell>
                              <TableCell sx={{ whiteSpace: "nowrap" }}>
                                {formatSessionDuration(s.durationMinutes, t)}
                              </TableCell>
                              <TableCell>
                                {s.score != null ? (
                                  <Chip
                                    size="small"
                                    color={s.score >= 70 ? "success" : "error"}
                                    label={`${s.score}%`}
                                  />
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{ whiteSpace: "nowrap" }}
                                onClick={(ev) => ev.stopPropagation()}
                              >
                                <Tooltip title={t("common:actions.details")}>
                                  <IconButton size="small" onClick={() => setDetails(s)}>
                                    <Eye className="size-4" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t("results.exportOne")}>
                                  <IconButton size="small" onClick={() => exportOne(s)}>
                                    <Download className="size-4" />
                                  </IconButton>
                                </Tooltip>
                                {completed && attempts.canRetake && (
                                  <Tooltip title={t("results.retake", { left: attempts.remaining })}>
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() =>
                                        navigate(
                                          runUrl({
                                            testId: s.testId,
                                            employeeId: s.employeeId,
                                            duration: RETAKE_DURATION,
                                          }),
                                        )
                                      }
                                    >
                                      <RotateCcw className="size-4" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    <TablePagination
                      component="div"
                      count={filtered.length}
                      page={page}
                      rowsPerPage={rowsPerPage}
                      rowsPerPageOptions={[10, 20, 50]}
                      onPageChange={(_, p) => setPage(p)}
                      onRowsPerPageChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setPage(0);
                      }}
                    />
                  </>
                )}
              </Card>

              {showRanking && (
                <Card sx={{ p: 2.5 }}>
                  <div className="mb-4 flex items-center gap-2 font-bold">
                    <Trophy className="size-5 text-amber-500" />
                    {t("results.ranking")}
                  </div>
                  {ranking.length === 0 ? (
                    <p className="py-6 text-center text-sm text-fg-muted">{t("results.noRanking")}</p>
                  ) : (
                    <ol className="space-y-3">
                      {ranking.map((r, i) => (
                        <li key={r.employee.id} className="flex items-center gap-3">
                          <span className="w-7 text-center">
                            {i < 3 ? (
                              <Crown className={`mx-auto size-5 ${RANK_COLORS[i]}`} />
                            ) : (
                              <span className="text-sm font-bold text-fg-muted">{i + 1}</span>
                            )}
                          </span>
                          <Avatar sx={{ width: 34, height: 34, fontSize: 13, bgcolor: "primary.main" }}>
                            {(r.employee.firstName?.[0] ?? "") + (r.employee.lastName?.[0] ?? "")}
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-semibold">{employeeFio(r.employee)}</span>
                              <span
                                className={`text-sm font-bold ${r.avg >= 70 ? "text-emerald-600" : "text-red-600"}`}
                              >
                                {r.avg}%
                              </span>
                            </div>
                            <LinearProgress
                              variant="determinate"
                              value={r.avg}
                              color={r.avg >= 70 ? "success" : r.avg >= 50 ? "warning" : "error"}
                              sx={{ mt: 0.75, height: 6, borderRadius: 3 }}
                            />
                            <div className="mt-1 text-xs text-fg-muted">
                              {t("results.rankingLine", { count: r.completed, best: r.best })}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </Card>
              )}
            </div>
          </div>
        )}
      </QueryState>

      <SessionDetailsDialog
        session={details}
        test={details ? testOf(details) : null}
        employee={details ? employeeOf(details) : null}
        departments={departments}
        onClose={() => setDetails(null)}
      />
    </>
  );
}

function statusLabel(session, t) {
  return sessionStatus(session.status) === SESSION_STATUS.IN_PROGRESS
    ? t("results.status.inProgress")
    : t("results.status.completed");
}
