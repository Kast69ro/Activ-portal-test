import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import { internFullName, useGetInternQuery } from "@/entities/interns/internsApi";
import { formatDateTime } from "@/shared/lib/format";
import { EmptyState, PageHeader, QueryState } from "@/shared/ui";
import { ATTEMPTS_PAGE_SIZE, HISTORY_ROUTES } from "./routes";
import { StatusChip } from "./StatusChip";

/** Стажёр и его попытки */
export default function InternPage() {
  const { t } = useTranslation("intern-history");
  const { internId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");

  const query = useGetInternQuery({
    id: internId,
    status: status || undefined,
    limit: ATTEMPTS_PAGE_SIZE,
    offset: page * ATTEMPTS_PAGE_SIZE,
  });
  const intern = query.data?.intern;

  // Назад — туда, откуда пришли (со списком и фильтрами), иначе — к списку
  const goBack = () => (location.key !== "default" ? navigate(-1) : navigate(HISTORY_ROUTES.list));

  return (
    <>
      <PageHeader
        title={intern ? internFullName(intern) : t("intern")}
        description={t("attemptsSubtitle")}
        onBack={goBack}
      />

      <QueryState query={query}>
        {({ attempts, attemptsTotal }) => (
          <div className="space-y-5">
            {intern && (
              <div className="grid grid-cols-3 gap-4">
                {[
                  [t("columns.phone"), intern.phone],
                  [t("columns.branch"), intern.branch_name || "—"],
                  [t("inSystemSince"), formatDateTime(intern.created_at)],
                ].map(([label, value]) => (
                  <Card key={label} sx={{ p: 2.5 }}>
                    <div className="text-sm text-fg-muted">{label}</div>
                    <div className="mt-1 font-bold">{value}</div>
                  </Card>
                ))}
              </div>
            )}

            <Card>
              <div className="p-4">
                <TextField
                  select
                  value={status || "all"}
                  onChange={(e) => {
                    setStatus(e.target.value === "all" ? "" : e.target.value);
                    setPage(0);
                  }}
                  sx={{ width: 220 }}
                >
                  <MenuItem value="all">{t("allAttempts")}</MenuItem>
                  <MenuItem value="graded">{t("status.gradedPlural")}</MenuItem>
                  <MenuItem value="needs_grading">{t("status.needsGradingPlural")}</MenuItem>
                </TextField>
              </div>
              {attempts.length === 0 ? (
                <EmptyState title={t("noAttempts")} />
              ) : (
                <>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t("columns.test")}</TableCell>
                        <TableCell align="center">{t("columns.score")}</TableCell>
                        <TableCell>{t("columns.status")}</TableCell>
                        <TableCell>{t("columns.submitted")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attempts.map((a) => (
                        <TableRow
                          key={a.id}
                          hover
                          sx={{ cursor: "pointer" }}
                          onClick={() => navigate(HISTORY_ROUTES.attempt(a.id))}
                        >
                          <TableCell sx={{ fontWeight: 600 }}>{a.test_title}</TableCell>
                          <TableCell align="center">
                            {a.scored} / {a.total_questions}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1.5">
                              <StatusChip needsGrading={a.needs_grading} />
                              {a.auto_submitted && <Chip size="small" label={t("timeUp")} />}
                            </div>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(a.submitted_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    component="div"
                    count={attemptsTotal}
                    page={page}
                    rowsPerPage={ATTEMPTS_PAGE_SIZE}
                    rowsPerPageOptions={[ATTEMPTS_PAGE_SIZE]}
                    onPageChange={(_, p) => setPage(p)}
                  />
                </>
              )}
            </Card>
          </div>
        )}
      </QueryState>
    </>
  );
}
