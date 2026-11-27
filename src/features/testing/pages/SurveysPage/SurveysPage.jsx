/**
 * Список опросов: запуск, прохождение, предпросмотр; создание и правка — Admin.
 * Маршрут: /surveys. Доступ: все вошедшие.
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ClipboardList, Play, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Pagination from "@mui/material/Pagination";
import { ALL, employeeName, findById, useGetEmployeesQuery } from "@/entities/org/orgApi";
import { isSurvey, testTitle } from "@/entities/testing/model";
import { useDeleteTestMutation, useGetTestsQuery } from "@/entities/testing/testingApi";
import { getErrorMessage } from "@/shared/api/normalize";
import { selectIsAdmin } from "@/shared/model/auth";
import { EmptyState, PageHeader, QueryState, useConfirm, useToast } from "@/shared/ui";
import { EditorDialog } from "@/features/testing/components/EditorDialog";
import { PreviewDialog } from "@/features/testing/components/PreviewDialog";
import { StartDialog } from "@/features/testing/components/StartDialog";
import { SurveyTakingDialog } from "./components/SurveyTakingDialog";
import { TestCard } from "@/features/testing/components/TestCard";
import { selectSurveysPage, setSurveysPage } from "@/features/testing/model/testingSlice";

const PAGE_SIZE = 9;

export default function SurveysPage() {
  const { t, i18n } = useTranslation("testing");
  const dispatch = useDispatch();
  const toast = useToast();
  const confirm = useConfirm();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = useSelector(selectIsAdmin);
  const page = useSelector(selectSurveysPage);

  const testsQuery = useGetTestsQuery();
  const { data: employees } = useGetEmployeesQuery(ALL);
  const [deleteTest] = useDeleteTestMutation();

  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [start, setStart] = useState(null); // { itemId?, employeeId? } — открыт диалог запуска
  const [run, setRun] = useState(null);

  // «Пройти снова» со страницы результатов открывает запуск с выбранными опросом и сотрудником
  useEffect(() => {
    const retake = location.state?.retake;
    if (retake) {
      setStart({ itemId: retake.surveyId, employeeId: retake.employeeId });
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  const surveys = useMemo(() => (testsQuery.data ?? []).filter(isSurvey), [testsQuery.data]);
  const pages = Math.max(1, Math.ceil(surveys.length / PAGE_SIZE));
  const current = Math.min(page, pages);

  const remove = async (survey) => {
    if (
      !(await confirm({ title: t("surveys.deleteConfirm", { name: testTitle(survey, i18n.language) }), danger: true }))
    )
      return;
    try {
      await deleteTest(survey.id).unwrap();
      toast.success(t("common:toast.deleted"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("common:toast.error")));
    }
  };

  return (
    <>
      <PageHeader
        title={t("surveys.title")}
        description={t("surveys.count", { count: surveys.length })}
        actions={
          <>
            <Button variant="outlined" startIcon={<Play className="size-4" />} onClick={() => setStart({})}>
              {t("surveys.start")}
            </Button>
            {isAdmin && (
              <Button variant="contained" startIcon={<Plus className="size-4" />} onClick={() => setEditing({})}>
                {t("surveys.create")}
              </Button>
            )}
          </>
        }
      />

      <QueryState query={testsQuery}>
        {() =>
          surveys.length === 0 ? (
            <Card>
              <EmptyState icon={ClipboardList} title={t("surveys.empty")} />
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-5">
                {surveys.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE).map((survey) => (
                  <TestCard
                    key={survey.id}
                    test={survey}
                    icon={ClipboardList}
                    isAdmin={isAdmin}
                    onOpen={isAdmin ? () => setPreview(survey) : undefined}
                    onEdit={() => setEditing(survey)}
                    onDelete={() => remove(survey)}
                  />
                ))}
              </div>
              {pages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination
                    count={pages}
                    page={current}
                    color="primary"
                    onChange={(_, p) => dispatch(setSurveysPage(p))}
                  />
                </div>
              )}
            </>
          )
        }
      </QueryState>

      <EditorDialog
        kind="survey"
        open={editing !== null}
        item={editing?.id != null ? editing : null}
        onClose={() => setEditing(null)}
      />
      <PreviewDialog test={preview} onClose={() => setPreview(null)} />
      <StartDialog
        kind="survey"
        open={start !== null}
        initial={start}
        items={surveys}
        onClose={() => setStart(null)}
        onStart={({ item, employeeId, duration }) => {
          setStart(null);
          setRun({
            survey: item,
            employeeId,
            employeeName: employeeName(findById(employees?.items, employeeId)),
            duration,
            startedAt: Date.now(),
          });
        }}
      />
      <SurveyTakingDialog run={run} onClose={() => setRun(null)} />
    </>
  );
}
