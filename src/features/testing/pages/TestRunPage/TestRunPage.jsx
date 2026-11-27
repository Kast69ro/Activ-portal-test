/**
 * Прохождение теста с таймером (параметры — в адресе, см. model/runUrl.js).
 * Маршрут: /test/run (на весь экран, без меню). Доступ: все вошедшие.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Flag, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import LinearProgress from "@mui/material/LinearProgress";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import { ALL, employeeName, findById, useGetEmployeesQuery } from "@/entities/org/orgApi";
import { QUESTION_TYPE, optionText, questionText, questionType, testTitle } from "@/entities/testing/model";
import {
  useFinishSessionMutation,
  useGetSessionsQuery,
  useGetTestsQuery,
  useStartSessionMutation,
  useSubmitSessionAnswerMutation,
} from "@/entities/testing/testingApi";
import { getErrorMessage } from "@/shared/api/normalize";
import { cn } from "@/shared/lib/cn";
import { formatDuration } from "@/shared/lib/format";
import { Loader, LogoMark, useConfirm, useToast } from "@/shared/ui";
import { QuestionTypeChip } from "@/features/testing/components/QuestionTypeChip";
import { RatingPicker } from "@/features/testing/components/RatingPicker";

/** Момент старта сессии хранится в sessionStorage — после обновления вкладки время не начинается заново */
const startKey = (id) => `test-run-start-${id}`;
const readStart = (id) => Number(sessionStorage.getItem(startKey(id))) || null;

export default function TestRunPage() {
  const { t, i18n } = useTranslation("testing");
  const lang = i18n.language;
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();

  const sessionId = params.get("session");
  const duration = Number(params.get("duration")) || 5;

  const testsQuery = useGetTestsQuery();
  const sessionsQuery = useGetSessionsQuery();
  const { data: employees } = useGetEmployeesQuery(ALL);
  const [startSession] = useStartSessionMutation();
  const [submitAnswer, submitState] = useSubmitSessionAnswerMutation();
  const [finishSession, finishState] = useFinishSessionMutation();

  const [startedSession, setStartedSession] = useState(null);
  const [startError, setStartError] = useState(null);
  const startRequested = useRef(false);

  // ─── Старт новой сессии (ровно один раз) ───
  useEffect(() => {
    if (sessionId || startRequested.current) return;
    startRequested.current = true;
    const testId = params.get("test");
    const employeeId = params.get("employee");
    startSession({ testId, employeeId })
      .unwrap()
      .then((session) => {
        sessionStorage.setItem(startKey(session.id), String(Date.now()));
        setStartedSession(session);
        setParams({ session: session.id, duration }, { replace: true });
        toast.success(t("run.started", { minutes: duration }));
      })
      .catch((error) => setStartError(getErrorMessage(error, t("run.startFailed"))));
  }, [sessionId, params, setParams, startSession, duration, toast, t]);

  const session = startedSession ?? (sessionsQuery.data ?? []).find((s) => String(s.id) === String(sessionId)) ?? null;
  const test = (testsQuery.data ?? []).find((x) => String(x.id) === String(session?.testId));
  const questions = useMemo(() => test?.questions ?? [], [test]);
  const employee = findById(employees?.items, session?.employeeId);

  // ─── Ответы: с сервера (при продолжении) + сохранённые сейчас ───
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(null);
  useEffect(() => {
    if (!session || !questions.length || index !== null) return;
    const saved = Object.fromEntries((session.answers ?? []).map((a) => [String(a.questionId), a]));
    setAnswers(saved);
    const firstOpen = questions.findIndex((q) => !saved[String(q.id)]);
    setIndex(firstOpen === -1 ? questions.length - 1 : firstOpen);
  }, [session, questions, index]);

  // ─── Таймер ───
  const [now, setNow] = useState(() => Date.now());
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (session && !readStart(session.id)) sessionStorage.setItem(startKey(session.id), String(Date.now()));
  }, [session]);
  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [finished]);

  const startedAt = session ? (readStart(session.id) ?? now) : now;
  // «Сейчас» обновляется раз в секунду и может отставать от момента старта — прошедшее время не бывает отрицательным
  const elapsed = Math.floor(Math.max(0, now - startedAt) / 1000);
  const remaining = Math.max(0, duration * 60 - elapsed);
  const active = Boolean(session) && !finished;

  // Предупреждение при закрытии вкладки во время теста
  useEffect(() => {
    if (!active) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);

  const finish = useCallback(async () => {
    if (!session || finished) return;
    try {
      await finishSession({ sessionId: session.id, employeeId: session.employeeId }).unwrap();
      sessionStorage.removeItem(startKey(session.id));
      setFinished(true);
    } catch (error) {
      toast.error(getErrorMessage(error, t("run.finishFailed")));
    }
  }, [session, finished, finishSession, toast, t]);

  // Время вышло — завершаем автоматически
  const autoFinished = useRef(false);
  useEffect(() => {
    if (active && remaining === 0 && !autoFinished.current) {
      autoFinished.current = true;
      toast.warning(t("run.timeUp"));
      finish();
    }
  }, [active, remaining, finish, toast, t]);

  // ─── Черновик ответа на текущий вопрос ───
  const question = index !== null ? questions[index] : null;
  const type = questionType(question?.type);
  const [draft, setDraft] = useState({ optionId: null, text: "", rating: null });
  useEffect(() => {
    if (!question) return;
    const saved = answers[String(question.id)];
    setDraft({
      optionId: type === QUESTION_TYPE.CHOICE ? (saved?.optionId ?? null) : null,
      text: type === QUESTION_TYPE.OPEN ? (saved?.textAnswer ?? "") : "",
      rating: type === QUESTION_TYPE.RATING ? (saved?.optionId ?? null) : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- черновик сбрасывается только при смене вопроса
  }, [question?.id]);

  const [confirmFinish, setConfirmFinish] = useState(false);

  const saveAnswer = async () => {
    let body;
    if (type === QUESTION_TYPE.CHOICE) {
      if (draft.optionId == null) return toast.warning(t("run.selectOption"));
      body = { optionId: draft.optionId };
    } else if (type === QUESTION_TYPE.OPEN) {
      if (!draft.text.trim()) return toast.warning(t("run.enterAnswer"));
      body = { textAnswer: draft.text.trim() };
    } else {
      if (!draft.rating) return toast.warning(t("run.selectRating"));
      body = { optionId: draft.rating, textAnswer: `${draft.rating}/10` };
    }
    try {
      await submitAnswer({ sessionId: session.id, questionId: question.id, ...body }).unwrap();
      setAnswers((a) => ({ ...a, [String(question.id)]: { questionId: question.id, ...body } }));
      if (index + 1 >= questions.length) setConfirmFinish(true);
      else setIndex(index + 1);
    } catch (error) {
      toast.error(getErrorMessage(error, t("run.answerFailed")));
    }
  };

  const exit = async () => {
    if (
      active &&
      !(await confirm({ title: t("run.exitTitle"), description: t("run.exitText"), confirmText: t("run.exit") }))
    )
      return;
    navigate("/test");
  };

  // ─── Состояния страницы ───
  if (startError) {
    return (
      <Centered>
        <Alert severity="error" sx={{ mb: 3 }}>
          {startError}
        </Alert>
        <Button component={Link} to="/test" variant="contained">
          {t("run.backToTests")}
        </Button>
      </Centered>
    );
  }

  if (finished) {
    return (
      <Centered>
        <CheckCircle2 className="mx-auto size-16 text-emerald-500" />
        <h1 className="mt-4 text-3xl font-extrabold">{t("run.finishedTitle")}</h1>
        <p className="mt-2 text-fg-muted">{t("run.finishedText")}</p>
        <Button component={Link} to="/test" variant="contained" size="large" sx={{ mt: 4 }}>
          {t("run.backToTests")}
        </Button>
      </Centered>
    );
  }

  if (!session || !test || index === null) {
    const notFound = sessionId && sessionsQuery.isSuccess && testsQuery.isSuccess && (!session || !test);
    return notFound ? (
      <Centered>
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t("run.notFound")}
        </Alert>
        <Button component={Link} to="/test" variant="contained">
          {t("run.backToTests")}
        </Button>
      </Centered>
    ) : (
      <Loader className="min-h-dvh" />
    );
  }

  const answeredCount = questions.filter((q) => answers[String(q.id)]).length;
  const timeTone = remaining <= 60 ? "error" : remaining <= 300 ? "warning" : "success";

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-10 border-b border-line bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-6xl items-center gap-4 px-8">
          <LogoMark className="size-8" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold">{testTitle(test, lang)}</div>
            <div className="text-xs text-fg-muted">{employeeName(employee)}</div>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xl font-extrabold tabular-nums",
              timeTone === "error" && "animate-pulse bg-red-50 text-red-600 dark:bg-red-900/30",
              timeTone === "warning" && "bg-amber-50 text-amber-600 dark:bg-amber-900/30",
              timeTone === "success" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30",
            )}
          >
            <Clock className="size-5" />
            {formatDuration(remaining)}
          </div>
          <Button color="inherit" startIcon={<LogOut className="size-4" />} onClick={exit}>
            {t("run.exit")}
          </Button>
        </div>
        <LinearProgress variant="determinate" color={timeTone} value={Math.min(100, (remaining / (duration * 60)) * 100)} />
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-[220px_1fr] gap-6 px-8 py-8">
        <Card sx={{ p: 2, alignSelf: "start", position: "sticky", top: 96 }}>
          <div className="mb-3 text-sm font-semibold text-fg-muted">
            {t("run.answered", { answered: answeredCount, total: questions.length })}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => !submitState.isLoading && setIndex(i)}
                className={cn(
                  "grid aspect-square place-items-center rounded-lg text-sm font-bold transition",
                  i === index
                    ? "bg-brand-600 text-white"
                    : answers[String(q.id)]
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-muted text-fg-muted hover:text-fg",
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Flag className="size-4" />}
            sx={{ mt: 2 }}
            onClick={() => setConfirmFinish(true)}
          >
            {t("run.finish")}
          </Button>
        </Card>

        <Card sx={{ p: 4 }}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-fg-muted">
              {t("run.questionOf", { current: index + 1, total: questions.length })}
            </span>
            <QuestionTypeChip type={question.type} />
          </div>
          <h2 className="mt-3 text-2xl leading-snug font-bold">{questionText(question, lang)}</h2>

          <div className="mt-6">
            {type === QUESTION_TYPE.CHOICE && (
              <RadioGroup
                value={draft.optionId ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, optionId: Number(e.target.value) }))}
              >
                <div className="grid gap-2">
                  {question.options.map((o) => (
                    <FormControlLabel
                      key={o.id}
                      value={o.id}
                      control={<Radio />}
                      label={optionText(o, lang)}
                      className={cn(
                        "m-0! rounded-xl border px-3 py-1.5 transition",
                        draft.optionId === o.id
                          ? "border-brand-500 bg-brand-50/60 dark:bg-brand-900/20"
                          : "border-line hover:bg-muted",
                      )}
                    />
                  ))}
                </div>
              </RadioGroup>
            )}
            {type === QUESTION_TYPE.OPEN && (
              <TextField
                fullWidth
                multiline
                minRows={5}
                placeholder={t("run.answerPlaceholder")}
                value={draft.text}
                onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
              />
            )}
            {type === QUESTION_TYPE.RATING && (
              <>
                <p className="mb-3 text-sm text-fg-muted">{t("run.ratingHint")}</p>
                <RatingPicker value={draft.rating} onChange={(rating) => setDraft((d) => ({ ...d, rating }))} />
              </>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
            <Button
              startIcon={<ChevronLeft className="size-4" />}
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
            >
              {t("run.prev")}
            </Button>
            <Button
              variant="contained"
              size="large"
              endIcon={<ChevronRight className="size-4" />}
              loading={submitState.isLoading}
              onClick={saveAnswer}
            >
              {index + 1 >= questions.length ? t("run.saveAndFinish") : t("run.saveAndNext")}
            </Button>
          </div>
        </Card>
      </main>

      <Dialog open={confirmFinish} onClose={() => setConfirmFinish(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t("run.finishTitle")}</DialogTitle>
        <DialogContent>
          {answeredCount < questions.length ? (
            <Alert severity="warning">{t("run.unanswered", { count: questions.length - answeredCount })}</Alert>
          ) : (
            <p>{t("run.finishText")}</p>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={() => setConfirmFinish(false)}>
            {t("run.continueTest")}
          </Button>
          <Button variant="contained" loading={finishState.isLoading} onClick={finish}>
            {t("run.finish")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

function Centered({ children }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg p-8 text-center">
      <div className="max-w-md">{children}</div>
    </div>
  );
}
