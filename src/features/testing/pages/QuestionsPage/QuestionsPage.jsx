/**
 * Маршрут: /question (в меню скрыт). Доступ: Admin.
 */
import { useState } from "react";
import { Link } from "react-router";
import { ClipboardCheck, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TablePagination from "@mui/material/TablePagination";
import Tooltip from "@mui/material/Tooltip";
import { QUESTION_TYPE, correctAnswer, optionText, questionText, questionType } from "@/entities/testing/model";
import {
  useCreateQuestionMutation,
  useDeleteQuestionMutation,
  useGetQuestionsQuery,
  useUpdateQuestionMutation,
} from "@/entities/testing/testingApi";
import { getErrorMessage } from "@/shared/api/normalize";
import { EmptyState, PageHeader, QueryState, useConfirm, useToast } from "@/shared/ui";
import { QuestionForm } from "@/features/testing/components/QuestionForm";
import { QuestionTypeChip } from "@/features/testing/components/QuestionTypeChip";

/** Банк вопросов (страница /question) */
export default function QuestionsPage() {
  const { t, i18n } = useTranslation("testing");
  const lang = i18n.language;
  const toast = useToast();
  const confirm = useConfirm();
  const [page, setPage] = useState({ pageNumber: 1, pageSize: 10 });
  const [editing, setEditing] = useState(null);
  const [revealed, setRevealed] = useState(null);

  const query = useGetQuestionsQuery(page);
  const [create, createState] = useCreateQuestionMutation();
  const [update, updateState] = useUpdateQuestionMutation();
  const [remove] = useDeleteQuestionMutation();

  const save = async (payload) => {
    try {
      if (editing?.id != null) await update({ id: editing.id, ...payload }).unwrap();
      else await create(payload).unwrap();
      toast.success(t(editing?.id != null ? "common:toast.saved" : "question.created"));
      setEditing(null);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, t("common:toast.error")));
      return false;
    }
  };

  const handleDelete = async (q) => {
    if (!(await confirm({ title: t("question.deleteForever"), description: questionText(q, lang), danger: true })))
      return;
    try {
      await remove(q.id).unwrap();
      toast.success(t("common:toast.deleted"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("common:toast.error")));
    }
  };

  const answerOf = (q) => {
    if (questionType(q.type) === QUESTION_TYPE.RATING) return q.optionId ? `${q.optionId}/10` : "—";
    const correct = correctAnswer(q);
    return correct ? optionText(correct, lang) : t("questions.noAnswer");
  };

  return (
    <>
      <PageHeader
        title={t("questions.title")}
        description={t("questions.subtitle")}
        actions={
          <>
            <Button component={Link} to="/test" variant="outlined" startIcon={<ClipboardCheck className="size-4" />}>
              {t("questions.toTests")}
            </Button>
            <Button variant="contained" startIcon={<Plus className="size-4" />} onClick={() => setEditing({})}>
              {t("question.create")}
            </Button>
          </>
        }
      />

      <QueryState query={query}>
        {({ items, total }) =>
          items.length === 0 ? (
            <Card>
              <EmptyState title={t("questions.empty")} />
            </Card>
          ) : (
            <Card>
              <ul className="divide-y divide-line">
                {items.map((q, i) => (
                  <li key={q.id} className="flex items-start gap-4 px-5 py-4">
                    <span className="mt-0.5 w-8 text-sm font-bold text-fg-muted">
                      {(page.pageNumber - 1) * page.pageSize + i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{questionText(q, lang)}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <QuestionTypeChip type={q.type} />
                        {revealed === q.id && (
                          <span className="text-sm">
                            <span className="text-fg-muted">{t("question.correct")}: </span>
                            <span className="font-semibold text-emerald-600">{answerOf(q)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <Tooltip title={t(revealed === q.id ? "questions.hideAnswer" : "questions.showAnswer")}>
                      <IconButton size="small" onClick={() => setRevealed(revealed === q.id ? null : q.id)}>
                        {revealed === q.id ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t("common:actions.edit")}>
                      <IconButton size="small" onClick={() => setEditing(q)}>
                        <Pencil className="size-4" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t("common:actions.delete")}>
                      <IconButton size="small" color="error" onClick={() => handleDelete(q)}>
                        <Trash2 className="size-4" />
                      </IconButton>
                    </Tooltip>
                  </li>
                ))}
              </ul>
              <TablePagination
                component="div"
                count={total}
                page={page.pageNumber - 1}
                rowsPerPage={page.pageSize}
                rowsPerPageOptions={[10, 20, 50]}
                onPageChange={(_, p) => setPage((s) => ({ ...s, pageNumber: p + 1 }))}
                onRowsPerPageChange={(e) => setPage({ pageNumber: 1, pageSize: Number(e.target.value) })}
              />
            </Card>
          )
        }
      </QueryState>

      <Dialog open={editing !== null} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t(editing?.id != null ? "questions.edit" : "question.create")}</DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <QuestionForm
            initial={editing?.id != null ? editing : null}
            submitLabel={t("common:actions.save")}
            loading={createState.isLoading || updateState.isLoading}
            onSubmit={save}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
