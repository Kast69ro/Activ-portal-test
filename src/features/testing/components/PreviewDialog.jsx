/**
 * Используют TestsPage и SurveysPage.
 */
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { correctAnswer, optionText, questionText, testDescription, testTitle } from "@/entities/testing/model";
import { QuestionTypeChip } from "./QuestionTypeChip";

/** Просмотр теста/опроса: список вопросов, для тестов — с правильными ответами */
export function PreviewDialog({ test, showAnswers, onClose }) {
  const { t, i18n } = useTranslation("testing");
  const lang = i18n.language;

  return (
    <Dialog open={Boolean(test)} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      {test && (
        <>
          <DialogTitle>{testTitle(test, lang)}</DialogTitle>
          <DialogContent dividers>
            {testDescription(test, lang) && <p className="mb-4 text-fg-muted">{testDescription(test, lang)}</p>}
            {(test.questions ?? []).length === 0 ? (
              <p className="py-6 text-center text-fg-muted">{t("preview.empty")}</p>
            ) : (
              <ol className="space-y-3">
                {test.questions.map((q, i) => {
                  const correct = showAnswers ? correctAnswer(q) : null;
                  return (
                    <li key={q.id ?? i} className="rounded-xl border border-line p-4">
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-semibold">
                          {i + 1}. {questionText(q, lang)}
                        </span>
                        <QuestionTypeChip type={q.type} />
                      </div>
                      {q.options?.length > 0 && (
                        <ul className="mt-2 space-y-1 text-sm">
                          {q.options.map((o, j) => (
                            <li
                              key={o.id ?? j}
                              className={
                                showAnswers && o.isCorrect ? "font-semibold text-emerald-600" : "text-fg-muted"
                              }
                            >
                              • {optionText(o, lang)}
                            </li>
                          ))}
                        </ul>
                      )}
                      {correct && (
                        <div className="mt-2 text-sm">
                          <span className="text-fg-muted">{t("question.correct")}: </span>
                          <span className="font-semibold">{optionText(correct, lang)}</span>
                        </div>
                      )}
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
