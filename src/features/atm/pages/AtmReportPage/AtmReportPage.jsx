/**
 * Выписка банкомата за период: график операций и таблица с банком карты по BIN.
 * Маршрут: /atm/:id/report?from=YYYY-MM-DD&to=YYYY-MM-DD. Доступ: Admin.
 */
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { CalendarRange } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import { useGetAtmTransactionsQuery } from "@/features/atm/api";
import { StatementDialog } from "@/features/atm/components/StatementDialog";
import { formatDate } from "@/shared/lib/format";
import { EmptyState, PageHeader, QueryState } from "@/shared/ui";
import { TransactionsChart } from "./components/TransactionsChart";
import { TransactionsTable } from "./components/TransactionsTable";

const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? "");

export default function AtmReportPage() {
  const { t } = useTranslation("atm");
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);

  const fromDate = params.get("from");
  const toDate = params.get("to");
  const hasPeriod = isDate(fromDate) && isDate(toDate);

  const query = useGetAtmTransactionsQuery({ atmId: id, fromDate, toDate }, { skip: !hasPeriod });

  const changePeriod = (period) => {
    setDialogOpen(false);
    navigate(`/atm/${encodeURIComponent(id)}/report?from=${period.fromDate}&to=${period.toDate}`, { replace: true });
  };

  return (
    <>
      <PageHeader
        title={t("report.title", { id })}
        description={
          hasPeriod
            ? t("report.period", { from: formatDate(`${fromDate}T00:00:00`), to: formatDate(`${toDate}T00:00:00`) })
            : undefined
        }
        onBack={() => navigate("/atm")}
        actions={
          <Button variant="outlined" startIcon={<CalendarRange className="size-4" />} onClick={() => setDialogOpen(true)}>
            {t("report.changePeriod")}
          </Button>
        }
      />

      {hasPeriod ? (
        <QueryState query={query}>
          {(transactions) => (
            <>
              <TransactionsChart transactions={transactions} />
              <TransactionsTable transactions={transactions} />
            </>
          )}
        </QueryState>
      ) : (
        <Card>
          <EmptyState
            icon={CalendarRange}
            title={t("report.noPeriod")}
            action={
              <Button variant="contained" onClick={() => setDialogOpen(true)}>
                {t("report.choosePeriod")}
              </Button>
            }
          />
        </Card>
      )}

      <StatementDialog
        open={dialogOpen}
        atmId={id}
        initial={hasPeriod ? { fromDate, toDate } : undefined}
        onClose={() => setDialogOpen(false)}
        onSubmit={changePeriod}
      />
    </>
  );
}
