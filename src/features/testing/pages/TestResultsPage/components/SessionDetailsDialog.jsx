import { useState } from "react";
import { CheckCircle2, Star, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { employeeFio, findById } from "@/entities/org/orgApi";
import {
  QUESTION_TYPE,
  SESSION_STATUS,
  questionText,
  questionType,
  sessionAnswerText,
  sessionStatus,
  testTitle,
} from "@/entities/testing/model";
import { formatDateTime } from "@/shared/lib/format";
import { formatSessionDuration } from "@/features/testing/model/sessionFormat";

/** Детали сессии прохождения: сведения и ответы */
export function SessionDetailsDialog({ session, test, employee, departments, onClose }) {
  const { t, i18n } = useTranslation("testing");
  const lang = i18n.language;
  const [tab, setTab] = useState("info");

  const findQuestion = (id) => test?.questions?.find((q) => String(q.id) === String(id));

  const rows = session
    ? [
        [t("results.columns.employee"), employee ? employeeFio(employee) : `#${session.employeeId}`],
        [t("common:fields.department"), findById(departments, employee?.departmentId)?.name ?? "—"],
        [t("results.columns.test"), test ? testTitle(test, lang) : `#${session.testId}`],
        [
          t("common:fields.status"),
          sessionStatus(session.status) === SESSION_STATUS.IN_PROGRESS
            ? t("results.status.inProgress")
            : t("results.status.completed"),
        ],
        [t("results.columns.started"), formatDateTime(session.startedAt)],
        [t("results.columns.finished"), formatDateTime(session.finishedAt)],
        [t("results.columns.duration"), formatSessionDuration(session.durationMinutes, t)],
        [t("results.columns.score"), session.score != null ? `${session.score}%` : "—"],
        [t("results.correct"), `${session.correctAnswersCount ?? 0} / ${session.totalQuestionsCount ?? 0}`],
      ]
    : [];

  return (
    <Dialog open={Boolean(session)} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      {session && (
        <>
          <DialogTitle>
            {t("results.details")} #{session.id}
          </DialogTitle>
          <div className="px-6">
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab value="info" label={t("results.info")} />
              <Tab value="answers" label={t("results.answers", { count: session.answers?.length ?? 0 })} />
            </Tabs>
          </div>
          <DialogContent dividers>
            {tab === "info" ? (
              <dl className="divide-y divide-line">
                {rows.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[180px_1fr] gap-3 py-2.5 text-sm">
                    <dt className="text-fg-muted">{label}</dt>
                    <dd className="font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (session.answers ?? []).length === 0 ? (
              <p className="py-6 text-center text-fg-muted">{t("results.noAnswers")}</p>
            ) : (
              <ol className="space-y-3">
                {session.answers.map((a, i) => {
                  const q = findQuestion(a.questionId);
                  const isRating = questionType(q?.type) === QUESTION_TYPE.RATING;
                  return (
                    <li key={i} className="rounded-xl border border-line p-4">
                      <div className="font-semibold">
                        {i + 1}. {q ? questionText(q, lang) : `#${a.questionId}`}
                      </div>
                      <div className="mt-1 text-sm">
                        <span className="text-fg-muted">{t("results.answer")}: </span>
                        {sessionAnswerText(a, q, lang)}
                      </div>
                      <div className="mt-2">
                        {isRating ? (
                          <Chip
                            size="small"
                            color="warning"
                            icon={<Star className="size-3.5" />}
                            label={t("results.ratingSaved")}
                          />
                        ) : a.isCorrect ? (
                          <Chip
                            size="small"
                            color="success"
                            icon={<CheckCircle2 className="size-3.5" />}
                            label={t("results.right")}
                          />
                        ) : (
                          <Chip
                            size="small"
                            color="error"
                            icon={<XCircle className="size-3.5" />}
                            label={t("results.wrong")}
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button variant="contained" onClick={onClose}>
              {t("common:actions.close")}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
