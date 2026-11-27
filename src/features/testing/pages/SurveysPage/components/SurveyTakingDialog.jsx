/**
 * Используется только в SurveysPage.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import FormControlLabel from "@mui/material/FormControlLabel";
import LinearProgress from "@mui/material/LinearProgress";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import { QUESTION_TYPE, optionText, questionText, questionType, testTitle } from "@/entities/testing/model";
import { cn } from "@/shared/lib/cn";
import { formatDuration } from "@/shared/lib/format";
import { useToast } from "@/shared/ui";
import { saveSurveyResult } from "@/features/testing/model/surveyResultsSlice";
import { QuestionTypeChip } from "@/features/testing/components/QuestionTypeChip";
import { RatingPicker } from "@/features/testing/components/RatingPicker";

/**
 * Прохождение опроса на весь экран. run = { survey, employee, employeeName, duration } | null.
 * Результат сохраняется в surveyResultsSlice (localStorage).
 */
export function SurveyTakingDialog({ run, onClose }) {
  return (
    <Dialog open={Boolean(run)} onClose={() => {}} fullScreen>
      {run && <SurveyTaking key={`${run.survey.id}-${run.employeeId}-${run.startedAt}`} run={run} onClose={onClose} />}
    </Dialog>
  );
}

function SurveyTaking({ run, onClose }) {
  const { t, i18n } = useTranslation("testing");
  const lang = i18n.language;
  const dispatch = useDispatch();
  const toast = useToast();
  const { survey, employeeId, employeeName, duration } = run;
  const questions = useMemo(() => survey.questions ?? [], [survey]);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [done, setDone] = useState(false);
  const startedAt = useRef(run.startedAt);

  const answered = Object.keys(answers).length;

  const complete = useCallback(
    (force) => {
      if (done) return;
      if (!force && answered < questions.length) {
        toast.warning(t("survey.answerAll", { count: questions.length - answered }));
        return;
      }
      dispatch(
        saveSurveyResult({
          surveyId: survey.id,
          employeeId,
          employeeName,
          surveyName: testTitle(survey, lang),
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId: Number.isNaN(Number(questionId)) ? questionId : Number(questionId),
            answer,
          })),
          questions,
          totalQuestions: questions.length,
          completedAt: new Date().toISOString(),
          timeSpent: Math.floor((Date.now() - startedAt.current) / 1000),
          isCompleted: answered === questions.length,
        }),
      );
      setDone(true);
    },
    [done, answered, questions, survey, employeeId, employeeName, answers, lang, dispatch, toast, t],
  );

  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [done]);

  useEffect(() => {
    if (timeLeft === 0 && !done) {
      toast.warning(t("run.timeUp"));
      complete(true);
    }
  }, [timeLeft, done, complete, toast, t]);

  if (done) {
    return (
      <div className="grid min-h-full place-items-center bg-bg p-8 text-center">
        <div>
          <CheckCircle2 className="mx-auto size-16 text-emerald-500" />
          <h1 className="mt-4 text-3xl font-extrabold">{t("survey.thanks")}</h1>
          <p className="mt-2 text-fg-muted">{t("survey.saved")}</p>
          <Button variant="contained" size="large" sx={{ mt: 4 }} onClick={onClose}>
            {t("common:actions.close")}
          </Button>
        </div>
      </div>
    );
  }

  const question = questions[index];
  const type = questionType(question?.type);
  const value = answers[String(question?.id)];
  const setValue = (v) => setAnswers((a) => ({ ...a, [String(question.id)]: v }));

  return (
    <div className="flex min-h-full flex-col bg-bg">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex h-18 max-w-4xl items-center gap-4 px-8">
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold">{testTitle(survey, lang)}</div>
            <div className="text-xs text-fg-muted">{employeeName}</div>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-lg font-extrabold tabular-nums",
              timeLeft < 60 ? "animate-pulse bg-red-50 text-red-600 dark:bg-red-900/30" : "bg-muted",
            )}
          >
            <Clock className="size-5" /> {formatDuration(timeLeft)}
          </div>
        </div>
        <LinearProgress variant="determinate" value={(answered / Math.max(1, questions.length)) * 100} />
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-8 py-10">
        {!question ? (
          <p className="text-center text-fg-muted">{t("preview.empty")}</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-fg-muted">
                {t("run.questionOf", { current: index + 1, total: questions.length })}
              </span>
              <QuestionTypeChip type={question.type} />
            </div>
            <h2 className="mt-3 text-2xl font-bold">{questionText(question, lang)}</h2>

            <div className="mt-6">
              {type === QUESTION_TYPE.CHOICE && (
                <RadioGroup value={value ?? ""} onChange={(e) => setValue(e.target.value)}>
                  <div className="grid gap-2">
                    {question.options.map((o, i) => {
                      const optionValue = String(o.id ?? i);
                      return (
                        <FormControlLabel
                          key={optionValue}
                          value={optionValue}
                          control={<Radio />}
                          label={optionText(o, lang)}
                          className={cn(
                            "m-0! rounded-xl border bg-card px-3 py-1.5",
                            String(value) === optionValue ? "border-brand-500" : "border-line",
                          )}
                        />
                      );
                    })}
                  </div>
                </RadioGroup>
              )}
              {type === QUESTION_TYPE.OPEN && (
                <TextField
                  fullWidth
                  multiline
                  minRows={5}
                  placeholder={t("run.answerPlaceholder")}
                  value={value ?? ""}
                  onChange={(e) => setValue(e.target.value)}
                />
              )}
              {type === QUESTION_TYPE.RATING && <RatingPicker value={value} onChange={setValue} />}
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-line bg-card">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-8 py-4">
          <Button
            startIcon={<ChevronLeft className="size-4" />}
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
          >
            {t("run.prev")}
          </Button>
          <span className="flex-1 text-center text-sm text-fg-muted">
            {t("run.answered", { answered, total: questions.length })}
          </span>
          {index < questions.length - 1 ? (
            <Button
              variant="contained"
              endIcon={<ChevronRight className="size-4" />}
              onClick={() => setIndex(index + 1)}
            >
              {t("run.next")}
            </Button>
          ) : (
            <Button variant="contained" onClick={() => complete(false)}>
              {t("survey.complete")}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
