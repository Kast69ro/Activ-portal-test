import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import { ALL, employeeName, findById, useGetEmployeesQuery } from "@/entities/org/orgApi";
import { QUESTION_TYPE, optionText, questionText, questionType, testTitle } from "@/entities/testing/model";
import {
  useCreateAnswerMutation,
  useDeleteAnswerMutation,
  useGetAnswersQuery,
  useGetQuestionsQuery,
  useGetTestsQuery,
} from "@/entities/testing/testingApi";
import { getErrorMessage } from "@/shared/api/normalize";
import { EmptyState, PageHeader, QueryState, useConfirm, useToast } from "@/shared/ui";
import { QuestionTypeChip } from "@/features/testing/components/QuestionTypeChip";

const EMPTY = { testId: "", questionId: "", employeeId: null, optionId: "", textAnswer: "" };

/** Ручной ввод ответов сотрудников (страница /reply) */
export default function AnswersPage() {
  const { t, i18n } = useTranslation("testing");
  const lang = i18n.language;
  const toast = useToast();
  const confirm = useConfirm();

  const answersQuery = useGetAnswersQuery();
  const { data: tests = [] } = useGetTestsQuery();
  const { data: questionsData } = useGetQuestionsQuery();
  const { data: employeesData } = useGetEmployeesQuery(ALL);
  const [create, createState] = useCreateAnswerMutation();
  const [remove] = useDeleteAnswerMutation();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const questions = questionsData?.items ?? [];
  const employees = employeesData?.items ?? [];
  const test = tests.find((x) => String(x.id) === String(form.testId));
  const questionOptions = test?.questions?.length ? test.questions : questions;
  const question = questionOptions.find((q) => String(q.id) === String(form.questionId));
  const qType = questionType(question?.type);

  const findQuestion = (id) => questions.find((q) => String(q.id) === String(id));

  const save = async () => {
    if (!form.testId || !form.questionId || !form.employeeId) return toast.warning(t("answers.fillAll"));
    if (qType === QUESTION_TYPE.CHOICE && !form.optionId) return toast.warning(t("run.selectOption"));
    if (qType === QUESTION_TYPE.OPEN && !form.textAnswer.trim()) return toast.warning(t("run.enterAnswer"));
    try {
      await create({
        testId: form.testId,
        questionId: form.questionId,
        employeeId: form.employeeId,
        optionId: form.optionId || null,
        textAnswer: form.textAnswer.trim(),
      }).unwrap();
      toast.success(t("common:toast.saved"));
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, t("common:toast.error")));
    }
  };

  const handleDelete = async (a) => {
    if (!(await confirm({ title: t("answers.deleteConfirm"), danger: true }))) return;
    try {
      await remove(a.id).unwrap();
      toast.success(t("common:toast.deleted"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("common:toast.error")));
    }
  };

  return (
    <>
      <PageHeader
        title={t("answers.title")}
        description={t("answers.subtitle")}
        actions={
          <Button
            variant="contained"
            startIcon={<Plus className="size-4" />}
            onClick={() => {
              setForm(EMPTY);
              setOpen(true);
            }}
          >
            {t("answers.add")}
          </Button>
        }
      />

      <Card>
        <QueryState query={answersQuery}>
          {(answers) =>
            answers.length === 0 ? (
              <EmptyState title={t("answers.empty")} />
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t("results.columns.test")}</TableCell>
                    <TableCell>{t("results.question")}</TableCell>
                    <TableCell>{t("results.columns.employee")}</TableCell>
                    <TableCell>{t("results.answer")}</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {answers.map((a) => {
                    const q = findQuestion(a.questionId);
                    const option = q?.options?.find((o) => String(o.id) === String(a.optionId));
                    const answerTest = tests.find((x) => String(x.id) === String(a.testId));
                    return (
                      <TableRow key={a.id} hover>
                        <TableCell>{answerTest ? testTitle(answerTest, lang) : "—"}</TableCell>
                        <TableCell sx={{ maxWidth: 380 }}>
                          <div className="font-semibold">{q ? questionText(q, lang) : `#${a.questionId}`}</div>
                          {q && (
                            <div className="mt-1">
                              <QuestionTypeChip type={q.type} />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{employeeName(findById(employees, a.employeeId))}</TableCell>
                        <TableCell sx={{ color: "success.main", fontWeight: 600 }}>
                          {option ? optionText(option, lang) : a.textAnswer || "—"}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="error" onClick={() => handleDelete(a)}>
                            <Trash2 className="size-4" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )
          }
        </QueryState>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("answers.add")}</DialogTitle>
        <DialogContent className="grid gap-4" sx={{ pt: "8px !important" }}>
          <TextField
            select
            label={t("results.columns.test")}
            value={form.testId}
            onChange={(e) => setForm({ ...EMPTY, employeeId: form.employeeId, testId: e.target.value })}
          >
            {tests.map((x) => (
              <MenuItem key={x.id} value={x.id}>
                {testTitle(x, lang)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={t("results.question")}
            value={form.questionId}
            onChange={(e) => setForm((f) => ({ ...f, questionId: e.target.value, optionId: "", textAnswer: "" }))}
          >
            {questionOptions.map((q) => (
              <MenuItem key={q.id} value={q.id}>
                {questionText(q, lang)}
              </MenuItem>
            ))}
          </TextField>
          <Autocomplete
            options={employees}
            value={findById(employees, form.employeeId) ?? null}
            onChange={(_, v) => setForm((f) => ({ ...f, employeeId: v?.id ?? null }))}
            getOptionLabel={employeeName}
            isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
            renderInput={(params) => <TextField {...params} label={t("results.columns.employee")} />}
          />
          {question && qType === QUESTION_TYPE.CHOICE && (
            <TextField
              select
              label={t("results.answer")}
              value={form.optionId}
              onChange={(e) => setForm((f) => ({ ...f, optionId: e.target.value }))}
            >
              {question.options.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {optionText(o, lang)}
                </MenuItem>
              ))}
            </TextField>
          )}
          {question && qType !== QUESTION_TYPE.CHOICE && (
            <TextField
              label={t("results.answer")}
              multiline
              minRows={2}
              value={form.textAnswer}
              onChange={(e) => setForm((f) => ({ ...f, textAnswer: e.target.value }))}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={() => setOpen(false)}>
            {t("common:actions.cancel")}
          </Button>
          <Button variant="contained" loading={createState.isLoading} onClick={save}>
            {t("common:actions.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
