import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import {
  REGULAR_TEST_TYPE,
  SURVEY_TEST_TYPE,
  buildTestQuestions,
  correctAnswer,
  isRegularTest,
  isSurvey,
  optionText,
  questionText,
  questionType,
  usedQuestionIds,
} from "@/entities/testing/model";
import {
  useCreateQuestionMutation,
  useCreateTestMutation,
  useDeleteQuestionMutation,
  useGetQuestionsQuery,
  useGetTestsQuery,
  useUpdateTestMutation,
} from "@/entities/testing/testingApi";
import { getErrorMessage } from "@/shared/api/normalize";
import { cn } from "@/shared/lib/cn";
import { Loader, useConfirm, useToast } from "@/shared/ui";
import { QuestionForm } from "./QuestionForm";
import { QuestionTypeChip } from "./QuestionTypeChip";

const EMPTY_INFO = { titleRu: "", titleTj: "", descriptionRu: "", descriptionTj: "" };

/**
 * Мастер создания и редактирования теста или опроса (kind = "test" | "survey").
 * Шаги: информация → вопросы (выбор из банка или создание нового) → проверка.
 */
export function EditorDialog({ kind, open, item, onClose, onSaved }) {
  const { t, i18n } = useTranslation("testing");
  const toast = useToast();
  const confirm = useConfirm();
  const lang = i18n.language;
  const isEdit = item?.id != null;

  const questionsQuery = useGetQuestionsQuery(undefined, { skip: !open });
  const { data: tests = [] } = useGetTestsQuery(undefined, { skip: !open });
  const [createTest, createState] = useCreateTestMutation();
  const [updateTest, updateState] = useUpdateTestMutation();
  const [createQuestion, createQuestionState] = useCreateQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();

  const [step, setStep] = useState(0);
  const [tab, setTab] = useState("select");
  const [info, setInfo] = useState(EMPTY_INFO);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setTab("select");
    setInfo(item ? Object.fromEntries(Object.keys(EMPTY_INFO).map((k) => [k, item[k] ?? ""])) : EMPTY_INFO);
    setSelected((item?.questions ?? []).map((q) => String(q.id ?? q.questionId)));
    setSearch("");
    setTypeFilter("all");
    setError("");
  }, [open, item]);

  const questions = useMemo(() => questionsQuery.data?.items ?? [], [questionsQuery.data]);

  // Вопрос может входить только в один тест (опрос) того же вида
  const available = useMemo(() => {
    const sameKind = tests.filter(kind === "survey" ? isSurvey : isRegularTest);
    const used = usedQuestionIds(sameKind, item?.id);
    return questions.filter((q) => !used.has(String(q.id)));
  }, [questions, tests, kind, item]);

  const filtered = available.filter((q) => {
    const matchesType = typeFilter === "all" || questionType(q.type) === Number(typeFilter);
    return matchesType && questionText(q, lang).toLowerCase().includes(search.trim().toLowerCase());
  });

  const selectedQuestions = selected.map((id) => questions.find((q) => String(q.id) === id)).filter(Boolean);
  const toggle = (id) => setSelected((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  const move = (index, delta) =>
    setSelected((list) => {
      const next = [...list];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });

  const next = () => {
    if (step === 0 && !info.titleRu.trim()) return setError(t("editor.errors.title"));
    if (step === 1 && selected.length === 0) return setError(t("editor.errors.questions"));
    setError("");
    setStep((s) => s + 1);
  };

  const handleCreateQuestion = async (payload) => {
    try {
      const created = await createQuestion(payload).unwrap();
      toast.success(t("question.created"));
      if (created?.id != null) setSelected((list) => [...list, String(created.id)]);
      setTab("select");
      return true;
    } catch (e) {
      toast.error(getErrorMessage(e, t("common:toast.error")));
      return false;
    }
  };

  const handleDeleteQuestion = async (q) => {
    if (!(await confirm({ title: t("question.deleteForever"), description: questionText(q, lang), danger: true })))
      return;
    try {
      await deleteQuestion(q.id).unwrap();
      setSelected((list) => list.filter((id) => id !== String(q.id)));
      toast.success(t("common:toast.deleted"));
    } catch (e) {
      toast.error(getErrorMessage(e, t("common:toast.error")));
    }
  };

  const save = async () => {
    const ru = info.titleRu.trim();
    const payload = {
      titleRu: ru,
      titleTj: info.titleTj.trim() || ru,
      descriptionRu: info.descriptionRu.trim() || info.descriptionTj.trim(),
      descriptionTj: info.descriptionTj.trim() || info.descriptionRu.trim(),
      testType: kind === "survey" ? SURVEY_TEST_TYPE : REGULAR_TEST_TYPE,
      questions: buildTestQuestions(selected, questions),
    };
    try {
      const result = isEdit
        ? await updateTest({ id: item.id, ...payload }).unwrap()
        : await createTest(payload).unwrap();
      toast.success(t(isEdit ? `${kind}s.updated` : `${kind}s.created`));
      onSaved?.(result?.id ?? item?.id);
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e, t("common:toast.error")));
    }
  };

  const steps = [t("editor.steps.info"), t("editor.steps.questions"), t("editor.steps.review")];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: { sx: { height: "88vh" } } }}>
      <DialogTitle>{t(isEdit ? `${kind}s.edit` : `${kind}s.create`)}</DialogTitle>
      <div className="px-6 pb-2">
        <Stepper activeStep={step}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </div>

      <DialogContent dividers>
        {step === 0 && (
          <div className="grid grid-cols-2 gap-4">
            {["titleRu", "titleTj", "descriptionRu", "descriptionTj"].map((field) => (
              <TextField
                key={field}
                label={t(`editor.fields.${field}`)}
                required={field === "titleRu"}
                multiline={field.startsWith("description")}
                minRows={field.startsWith("description") ? 3 : undefined}
                value={info[field]}
                onChange={(e) => setInfo((v) => ({ ...v, [field]: e.target.value }))}
                autoFocus={field === "titleRu"}
              />
            ))}
            <p className="col-span-2 text-xs text-fg-muted">{t("editor.tjHint")}</p>
          </div>
        )}

        {step === 1 && (
          <>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
              <Tab value="select" label={t("editor.selectTab", { count: selected.length })} />
              <Tab value="create" label={t("editor.createTab")} />
            </Tabs>

            {tab === "create" ? (
              <QuestionForm mode={kind} loading={createQuestionState.isLoading} onSubmit={handleCreateQuestion} />
            ) : questionsQuery.isLoading ? (
              <Loader />
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <TextField
                    placeholder={t("editor.searchQuestions")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ flex: 1 }}
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
                  <TextField
                    select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    sx={{ width: 170 }}
                  >
                    <MenuItem value="all">{t("editor.allTypes")}</MenuItem>
                    <MenuItem value="1">{t("common:questionType.choice")}</MenuItem>
                    <MenuItem value="2">{t("common:questionType.open")}</MenuItem>
                    <MenuItem value="3">{t("common:questionType.rating")}</MenuItem>
                  </TextField>
                  <Button
                    onClick={() => setSelected((list) => [...new Set([...list, ...filtered.map((q) => String(q.id))])])}
                  >
                    {t("editor.selectAll")}
                  </Button>
                  <Button color="inherit" onClick={() => setSelected([])}>
                    {t("editor.clear")}
                  </Button>
                </div>

                {available.length === 0 ? (
                  <Alert severity="info">{t("editor.noAvailable")}</Alert>
                ) : (
                  <ul className="divide-y divide-line rounded-xl border border-line">
                    {filtered.map((q) => {
                      const checked = selected.includes(String(q.id));
                      const correct = kind === "test" ? correctAnswer(q) : null;
                      return (
                        <li
                          key={q.id}
                          className={cn(
                            "flex items-start gap-2 px-2 py-2",
                            checked && "bg-brand-50/60 dark:bg-brand-900/10",
                          )}
                        >
                          <Checkbox checked={checked} onChange={() => toggle(String(q.id))} />
                          <button
                            type="button"
                            onClick={() => toggle(String(q.id))}
                            className="min-w-0 flex-1 py-2 text-left"
                          >
                            <div className="font-medium">{questionText(q, lang)}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <QuestionTypeChip type={q.type} />
                              {correct && (
                                <span className="text-xs text-fg-muted">
                                  {t("question.correct")}: {optionText(correct, lang)}
                                </span>
                              )}
                            </div>
                          </button>
                          <Tooltip title={t("question.deleteForever")}>
                            <IconButton size="small" color="error" onClick={() => handleDeleteQuestion(q)}>
                              <Trash2 className="size-4" />
                            </IconButton>
                          </Tooltip>
                        </li>
                      );
                    })}
                    {filtered.length === 0 && (
                      <li className="px-4 py-6 text-center text-sm text-fg-muted">{t("editor.notFound")}</li>
                    )}
                  </ul>
                )}
              </>
            )}
          </>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-muted p-4">
              <div className="text-lg font-bold">{info.titleRu}</div>
              {info.titleTj && <div className="text-fg-muted">{info.titleTj}</div>}
              {info.descriptionRu && <p className="mt-2 text-sm">{info.descriptionRu}</p>}
            </div>
            <Alert severity="success">{t("editor.ready", { count: selectedQuestions.length })}</Alert>
            <ol className="divide-y divide-line rounded-xl border border-line">
              {selectedQuestions.map((q, i) => (
                <li key={q.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-6 text-sm font-bold text-fg-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{questionText(q, lang)}</span>
                  <QuestionTypeChip type={q.type} />
                  <IconButton size="small" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp className="size-4" />
                  </IconButton>
                  <IconButton size="small" disabled={i === selectedQuestions.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown className="size-4" />
                  </IconButton>
                </li>
              ))}
            </ol>
          </div>
        )}

        {error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="inherit" onClick={onClose}>
          {t("common:actions.cancel")}
        </Button>
        <div className="flex-1" />
        {step > 0 && <Button onClick={() => setStep((s) => s - 1)}>{t("common:actions.back")}</Button>}
        {step < 2 ? (
          <Button variant="contained" onClick={next}>
            {t("common:actions.next")}
          </Button>
        ) : (
          <Button variant="contained" onClick={save} loading={createState.isLoading || updateState.isLoading}>
            {t("common:actions.save")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
