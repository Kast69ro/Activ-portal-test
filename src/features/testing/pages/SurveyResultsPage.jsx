import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { BarChart3, CheckCircle2, Eye, FileSpreadsheet, Hourglass, RotateCcw, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import { QUESTION_TYPE, correctAnswer, optionText, questionText, questionType } from "@/entities/testing/model";
import { formatDateTime, formatDuration } from "@/shared/lib/format";
import { EmptyState, PageHeader, StatCard, useConfirm, useToast } from "@/shared/ui";
import { exportWorkbook } from "../excel";
import { MAX_SURVEY_ATTEMPTS, selectSurveyResults } from "../surveyResultsSlice";

const percentOf = (r) => (r.totalQuestions ? Math.round(((r.answers?.length ?? 0) / r.totalQuestions) * 100) : 0);
const findQuestion = (r, id) => r.questions?.find((q) => String(q.id) === String(id));

/** Текст ответа и проверка открытого вопроса по эталону (если он задан) */
function describeAnswer(result, answer, lang) {
  const q = findQuestion(result, answer.questionId);
  const type = questionType(q?.type);
  if (type === QUESTION_TYPE.CHOICE) {
    const option = q?.options?.find((o, i) => String(o.id ?? i) === String(answer.answer) || o.text === answer.answer);
    return { q, type, text: option ? optionText(option, lang) : String(answer.answer ?? "—"), check: null };
  }
  if (type === QUESTION_TYPE.RATING) return { q, type, text: `${answer.answer}/10`, check: null };
  const reference = q ? correctAnswer(q) : null;
  const check = reference
    ? String(answer.answer ?? "")
        .trim()
        .toLowerCase() ===
      String(reference.textRu ?? "")
        .trim()
        .toLowerCase()
    : null;
  return {
    q,
    type,
    text: String(answer.answer ?? "—"),
    check,
    reference: reference ? optionText(reference, lang) : "",
  };
}

export default function SurveyResultsPage() {
  const { t, i18n } = useTranslation("testing");
  const lang = i18n.language;
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const results = useSelector(selectSurveyResults);
  const [details, setDetails] = useState(null);

  const stats = useMemo(
    () => ({
      total: results.length,
      completed: results.filter((r) => r.isCompleted !== false).length,
      inProgress: results.filter((r) => r.isCompleted === false).length,
      avg: results.length ? Math.round(results.reduce((sum, r) => sum + percentOf(r), 0) / results.length) : 0,
    }),
    [results],
  );

  const retake = async (r) => {
    if ((r.attemptCount ?? 1) >= MAX_SURVEY_ATTEMPTS) return toast.warning(t("surveyResults.maxAttempts"));
    if (!(await confirm({ title: t("surveyResults.retake"), description: t("surveyResults.retakeConfirm") }))) return;
    navigate("/surveys", { state: { retake: { surveyId: r.surveyId, employeeId: r.employeeId } } });
  };

  const exportAll = async () => {
    try {
      await exportWorkbook("survey_results", [
        {
          name: t("results.excel.summary"),
          columns: [
            { header: "№", width: 6 },
            { header: t("results.columns.employee"), width: 30 },
            { header: t("surveyResults.survey"), width: 34 },
            { header: t("surveyResults.answered"), width: 12 },
            { header: t("surveyResults.total"), width: 14 },
            { header: t("surveyResults.percent"), width: 14 },
            { header: t("common:fields.status"), width: 16 },
            { header: t("surveyResults.timeSpent"), width: 14 },
            { header: t("common:fields.date"), width: 20 },
            { header: t("surveyResults.attempt"), width: 10 },
          ],
          rows: results.map((r, i) => [
            i + 1,
            r.employeeName ?? `#${r.employeeId}`,
            r.surveyName ?? `#${r.surveyId}`,
            r.answers?.length ?? 0,
            r.totalQuestions ?? 0,
            `${percentOf(r)}%`,
            r.isCompleted !== false ? t("surveyResults.completed") : t("surveyResults.notCompleted"),
            formatDuration(r.timeSpent ?? 0),
            formatDateTime(r.completedAt),
            r.attemptCount ?? 1,
          ]),
        },
        {
          name: t("results.excel.answers"),
          columns: [
            { header: t("results.columns.employee"), width: 28 },
            { header: t("surveyResults.survey"), width: 30 },
            { header: t("surveyResults.type"), width: 12 },
            { header: t("results.question"), width: 56 },
            { header: t("results.answer"), width: 40 },
            { header: t("surveyResults.reference"), width: 30 },
            { header: t("results.result"), width: 16 },
          ],
          rows: results.flatMap((r) =>
            (r.answers ?? []).map((a) => {
              const d = describeAnswer(r, a, lang);
              return [
                r.employeeName ?? `#${r.employeeId}`,
                r.surveyName ?? `#${r.surveyId}`,
                t(`common:questionType.${["", "choice", "open", "rating"][d.type]}`),
                d.q ? questionText(d.q, lang) : `#${a.questionId}`,
                d.text,
                d.reference ?? "",
                d.check == null ? "—" : d.check ? t("results.right") : t("results.wrong"),
              ];
            }),
          ),
        },
      ]);
      toast.success(t("results.excel.done"));
    } catch {
      toast.error(t("results.excel.failed"));
    }
  };

  return (
    <>
      <PageHeader
        title={t("surveyResults.title")}
        description={t("surveyResults.subtitle")}
        actions={
          <Button
            variant="contained"
            startIcon={<FileSpreadsheet className="size-4" />}
            disabled={!results.length}
            onClick={exportAll}
          >
            {t("results.exportAll")}
          </Button>
        }
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        {t("surveyResults.localNotice")}
      </Alert>

      <div className="mb-6 grid grid-cols-4 gap-5">
        <StatCard label={t("surveyResults.participants")} value={stats.total} icon={Users} />
        <StatCard label={t("surveyResults.completed")} value={stats.completed} icon={CheckCircle2} tone="success" />
        <StatCard label={t("surveyResults.notCompleted")} value={stats.inProgress} icon={Hourglass} tone="warning" />
        <StatCard label={t("surveyResults.avgCompletion")} value={`${stats.avg}%`} icon={BarChart3} tone="info" />
      </div>

      <Card>
        {results.length === 0 ? (
          <EmptyState icon={BarChart3} title={t("surveyResults.empty")} />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("results.columns.employee")}</TableCell>
                <TableCell>{t("surveyResults.survey")}</TableCell>
                <TableCell width={180}>{t("surveyResults.answered")}</TableCell>
                <TableCell>{t("common:fields.status")}</TableCell>
                <TableCell>{t("surveyResults.timeSpent")}</TableCell>
                <TableCell>{t("common:fields.date")}</TableCell>
                <TableCell>{t("surveyResults.attempt")}</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((r) => (
                <TableRow key={`${r.surveyId}-${r.employeeId}`} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{r.employeeName ?? `#${r.employeeId}`}</TableCell>
                  <TableCell>{r.surveyName ?? `#${r.surveyId}`}</TableCell>
                  <TableCell>
                    <div className="text-xs text-fg-muted">
                      {r.answers?.length ?? 0} / {r.totalQuestions ?? 0}
                    </div>
                    <LinearProgress
                      variant="determinate"
                      value={percentOf(r)}
                      sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={r.isCompleted !== false ? "success" : "warning"}
                      label={r.isCompleted !== false ? t("surveyResults.completed") : t("surveyResults.notCompleted")}
                    />
                  </TableCell>
                  <TableCell>{formatDuration(r.timeSpent ?? 0)}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(r.completedAt)}</TableCell>
                  <TableCell>
                    {r.attemptCount ?? 1} / {MAX_SURVEY_ATTEMPTS}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Tooltip title={t("common:actions.details")}>
                      <IconButton size="small" onClick={() => setDetails(r)}>
                        <Eye className="size-4" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t("surveyResults.retake")}>
                      <span>
                        <IconButton
                          size="small"
                          color="primary"
                          disabled={(r.attemptCount ?? 1) >= MAX_SURVEY_ATTEMPTS}
                          onClick={() => retake(r)}
                        >
                          <RotateCcw className="size-4" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={Boolean(details)} onClose={() => setDetails(null)} maxWidth="sm" fullWidth scroll="paper">
        {details && (
          <>
            <DialogTitle>
              {details.surveyName}
              <div className="text-sm font-medium text-fg-muted">{details.employeeName}</div>
            </DialogTitle>
            <DialogContent dividers>
              <ol className="space-y-3">
                {(details.answers ?? []).map((a, i) => {
                  const d = describeAnswer(details, a, lang);
                  return (
                    <li key={i} className="rounded-xl border border-line p-4">
                      <div className="font-semibold">
                        {i + 1}. {d.q ? questionText(d.q, lang) : `#${a.questionId}`}
                      </div>
                      <div className="mt-1 text-sm">
                        <span className="text-fg-muted">{t("results.answer")}: </span>
                        {d.text}
                      </div>
                      {d.check != null && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <Chip
                            size="small"
                            color={d.check ? "success" : "error"}
                            label={d.check ? t("results.right") : t("results.wrong")}
                          />
                          <span className="text-fg-muted">
                            {t("surveyResults.reference")}: {d.reference}
                          </span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button variant="contained" onClick={() => setDetails(null)}>
                {t("common:actions.close")}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
