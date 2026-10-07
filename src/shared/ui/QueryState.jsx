import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import { getErrorMessage } from "@/shared/api/normalize";
import { EmptyState } from "./EmptyState";
import { Loader } from "./Loader";

/**
 * Обёртка для результата RTK Query: показывает загрузку и ошибку,
 * а когда данные пришли — рендерит children(data).
 *
 *   const query = useGetEmployeesQuery();
 *   <QueryState query={query}>{(employees) => <Table rows={employees} />}</QueryState>
 *
 * Можно передать несколько запросов: queries={[a, b]} — children получит массив данных.
 */
export function QueryState({ query, queries, children }) {
  const { t } = useTranslation();
  const list = queries ?? [query];

  if (list.some((q) => q.isLoading)) return <Loader />;

  const failed = list.find((q) => q.isError);
  if (failed) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={t("error.title")}
        description={getErrorMessage(failed.error)}
        action={
          <Button variant="outlined" onClick={() => list.forEach((q) => q.isError && q.refetch())}>
            {t("error.retry")}
          </Button>
        }
      />
    );
  }

  return queries ? children(queries.map((q) => q.data)) : children(query.data);
}
