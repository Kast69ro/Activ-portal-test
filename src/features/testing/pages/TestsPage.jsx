import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ClipboardCheck, Play, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Pagination from "@mui/material/Pagination";
import { isRegularTest, testTitle } from "@/entities/testing/model";
import {
  useCreateAssignmentMutation,
  useDeleteTestMutation,
  useGetAssignmentsQuery,
  useGetTestsQuery,
} from "@/entities/testing/testingApi";
import { getErrorMessage } from "@/shared/api/normalize";
import { selectIsAdmin } from "@/shared/model/auth";
import { EmptyState, PageHeader, QueryState, useConfirm, useToast } from "@/shared/ui";
import { EditorDialog } from "../components/EditorDialog";
import { LinkDialog } from "../components/LinkDialog";
import { PreviewDialog } from "../components/PreviewDialog";
import { StartDialog } from "../components/StartDialog";
import { TestCard } from "../components/TestCard";
import { runUrl } from "../runUrl";
import { selectTestsPage, setTestsPage } from "../testingSlice";

const PAGE_SIZE = 9;

export default function TestsPage() {
  const { t, i18n } = useTranslation("testing");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const isAdmin = useSelector(selectIsAdmin);
  const page = useSelector(selectTestsPage);

  const testsQuery = useGetTestsQuery();
  const { data: assignments = [] } = useGetAssignmentsQuery();
  const [deleteTest] = useDeleteTestMutation();
  const [createAssignment, assignmentState] = useCreateAssignmentMutation();

  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [linkFor, setLinkFor] = useState(null);
  const [startOpen, setStartOpen] = useState(false);
  const [highlightId, setHighlightId] = useState(null);

  const tests = useMemo(() => (testsQuery.data ?? []).filter(isRegularTest), [testsQuery.data]);
  const pages = Math.max(1, Math.ceil(tests.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = tests.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const remove = async (test) => {
    if (!(await confirm({ title: t("tests.deleteConfirm", { name: testTitle(test, i18n.language) }), danger: true })))
      return;
    try {
      await deleteTest(test.id).unwrap();
      toast.success(t("common:toast.deleted"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("common:toast.error")));
    }
  };

  const start = async ({ item, employeeId, subDepartmentId, duration, existingSession }) => {
    if (existingSession) {
      navigate(runUrl({ sessionId: existingSession.id, duration }));
      return;
    }
    // Тест проходят по назначению — создаём его, если ещё нет (409 означает, что уже есть)
    const assigned = assignments.some(
      (a) => String(a.employeeId) === String(employeeId) && String(a.testId) === String(item.id),
    );
    if (!assigned) {
      try {
        await createAssignment({ testId: item.id, employeeId, subDepartmentId }).unwrap();
      } catch (error) {
        if (error?.status !== 409) {
          toast.error(getErrorMessage(error, t("start.assignmentFailed")));
          return;
        }
      }
    }
    navigate(runUrl({ testId: item.id, employeeId, duration }));
  };

  return (
    <>
      <PageHeader
        title={t("tests.title")}
        description={t("tests.count", { count: tests.length })}
        actions={
          <>
            <Button variant="outlined" startIcon={<Play className="size-4" />} onClick={() => setStartOpen(true)}>
              {t("tests.start")}
            </Button>
            {isAdmin && (
              <Button variant="contained" startIcon={<Plus className="size-4" />} onClick={() => setEditing({})}>
                {t("tests.create")}
              </Button>
            )}
          </>
        }
      />

      <QueryState query={testsQuery}>
        {() =>
          tests.length === 0 ? (
            <Card>
              <EmptyState
                icon={ClipboardCheck}
                title={t("tests.empty")}
                action={
                  isAdmin && (
                    <Button variant="contained" startIcon={<Plus className="size-4" />} onClick={() => setEditing({})}>
                      {t("tests.createFirst")}
                    </Button>
                  )
                }
              />
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-5">
                {visible.map((test) => (
                  <TestCard
                    key={test.id}
                    test={test}
                    icon={ClipboardCheck}
                    isAdmin={isAdmin}
                    highlighted={String(test.id) === String(highlightId)}
                    onOpen={isAdmin ? () => setPreview(test) : undefined}
                    onEdit={() => setEditing(test)}
                    onDelete={() => remove(test)}
                    onLink={() => setLinkFor(test)}
                  />
                ))}
              </div>
              {pages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination
                    count={pages}
                    page={current}
                    color="primary"
                    onChange={(_, p) => dispatch(setTestsPage(p))}
                  />
                </div>
              )}
            </>
          )
        }
      </QueryState>

      <EditorDialog
        kind="test"
        open={editing !== null}
        item={editing?.id != null ? editing : null}
        onClose={() => setEditing(null)}
        onSaved={(id) => {
          setHighlightId(id);
          dispatch(setTestsPage(1));
        }}
      />
      <PreviewDialog test={preview} showAnswers onClose={() => setPreview(null)} />
      <LinkDialog test={linkFor} onClose={() => setLinkFor(null)} />
      <StartDialog
        kind="test"
        open={startOpen}
        items={tests}
        loading={assignmentState.isLoading}
        onClose={() => setStartOpen(false)}
        onStart={start}
      />
    </>
  );
}
