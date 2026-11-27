/**
 * Маршрут: /test-history/attempt/:attemptId. Доступ: Admin.
 */
import { useLocation, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import { useGetAttemptQuery } from "@/entities/interns/internsApi";
import { formatDateTime } from "@/shared/lib/format";
import { PageHeader, QueryState } from "@/shared/ui";
import { HISTORY_ROUTES } from "./routes";
import { ScoreChip, StatusChip } from "./StatusChip";

/** Разбор попытки стажёра: ответы, баллы, правильные ответы */
export default function AttemptPage() {
  const { t } = useTranslation("intern-history");
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const query = useGetAttemptQuery(attemptId);
  const attempt = query.data?.attempt;

  const goBack = () => (location.key !== "default" ? navigate(-1) : navigate(HISTORY_ROUTES.list));

  return (
    <>
      <PageHeader title={attempt?.test_title ?? t("attempt")} description={t("answersSubtitle")} onBack={goBack} />

      <QueryState query={query}>
        {(view) => (
          <div className="space-y-5">
            {!view.source_available && <Alert severity="warning">{t("sourceUnavailable")}</Alert>}

            <div className="grid grid-cols-3 gap-4">
              {[
                [t("intern"), attempt?.intern_name ?? "—"],
                [t("columns.phone"), attempt?.intern_phone ?? "—"],
                [t("columns.branch"), attempt?.branch_name ?? "—"],
                [t("columns.submitted"), formatDateTime(attempt?.submitted_at)],
                [t("columns.score"), `${view.score} / ${view.total}`],
              ].map(([label, value]) => (
                <Card key={label} sx={{ p: 2.5 }}>
                  <div className="text-sm text-fg-muted">{label}</div>
                  <div className="mt-1 font-bold">{value}</div>
                </Card>
              ))}
              <Card sx={{ p: 2.5 }}>
                <div className="text-sm text-fg-muted">{t("columns.status")}</div>
                <div className="mt-1 flex gap-1.5">
                  <StatusChip needsGrading={view.status === "needs_grading"} />
                  {attempt?.auto_submitted && <Chip size="small" label={t("timeUp")} />}
                </div>
              </Card>
            </div>

            <div className="space-y-3">
              {[...(view.answers ?? [])]
                .sort((a, b) => a.position - b.position)
                .map((a) => (
                  <Card key={a.id} sx={{ p: 2.5 }}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold">
                        {a.position}. {a.question_text ?? t("questionNumber", { id: a.question_id })}
                      </span>
                      <ScoreChip score={a.score} />
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-fg-muted">{t("answer")}: </span>
                      {a.answer_text || "—"}
                    </div>
                    {a.score !== 1 && a.correct_answers?.length > 0 && (
                      <div className="mt-1 text-sm">
                        <span className="text-fg-muted">{t("correct")}: </span>
                        <span className="font-semibold text-emerald-600">{a.correct_answers.join(", ")}</span>
                      </div>
                    )}
                    {a.graded_by && <div className="mt-2 text-xs text-fg-muted">{t(`gradedBy.${a.graded_by}`)}</div>}
                  </Card>
                ))}
            </div>
          </div>
        )}
      </QueryState>
    </>
  );
}
