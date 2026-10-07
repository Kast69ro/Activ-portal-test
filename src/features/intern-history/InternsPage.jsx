/**
 * Маршрут: /test-history. Доступ: Admin.
 */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import Card from "@mui/material/Card";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import { internFullName, useGetBranchesQuery, useGetInternsQuery } from "@/entities/interns/internsApi";
import { formatDateTime } from "@/shared/lib/format";
import { useDebounce } from "@/shared/lib/useDebounce";
import { EmptyState, PageHeader, QueryState } from "@/shared/ui";
import { HISTORY_ROUTES, PAGE_SIZE } from "./routes";
import { StatusChip } from "./StatusChip";

/** Список стажёров. Поиск, филиал и страница хранятся в адресе — ссылкой можно поделиться */
export default function InternsPage() {
  const { t } = useTranslation("intern-history");
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const query = params.get("q") ?? "";
  const branchId = params.get("branch") ?? "";
  const page = Number(params.get("page")) || 1;

  const [search, setSearch] = useState(query);
  const debounced = useDebounce(search.trim(), 400);

  const update = (patch) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, String(v)) : next.delete(k)));
        return next;
      },
      { replace: true },
    );

  useEffect(() => {
    if (debounced !== query) update({ q: debounced, page: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- синхронизируем только итог ввода
  }, [debounced]);

  const { data: branches = [] } = useGetBranchesQuery();
  const internsQuery = useGetInternsQuery({
    search: query,
    branchId,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />

      <Card>
        <div className="flex gap-3 p-4">
          <TextField
            placeholder={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 320 }}
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
            value={branchId || "all"}
            onChange={(e) => update({ branch: e.target.value === "all" ? undefined : e.target.value, page: undefined })}
            sx={{ width: 260 }}
          >
            <MenuItem value="all">{t("allBranches")}</MenuItem>
            {branches.map((b) => (
              <MenuItem key={b.id} value={String(b.id)}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>
        </div>

        <QueryState query={internsQuery}>
          {({ items, total }) =>
            items.length === 0 ? (
              <EmptyState title={t("empty")} />
            ) : (
              <>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("columns.name")}</TableCell>
                      <TableCell>{t("columns.phone")}</TableCell>
                      <TableCell>{t("columns.branch")}</TableCell>
                      <TableCell align="center">{t("columns.attempts")}</TableCell>
                      <TableCell>{t("columns.status")}</TableCell>
                      <TableCell>{t("columns.updated")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((r) => (
                      <TableRow
                        key={r.id}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() => navigate(HISTORY_ROUTES.intern(r.id))}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>{internFullName(r)}</TableCell>
                        <TableCell>{r.phone}</TableCell>
                        <TableCell>{r.branch_name || "—"}</TableCell>
                        <TableCell align="center">{r.attempts_count}</TableCell>
                        <TableCell>
                          <StatusChip needsGrading={r.needs_grading} />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(r.updated_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  component="div"
                  count={total}
                  page={page - 1}
                  rowsPerPage={PAGE_SIZE}
                  rowsPerPageOptions={[PAGE_SIZE]}
                  onPageChange={(_, p) => update({ page: p > 0 ? p + 1 : undefined })}
                />
              </>
            )
          }
        </QueryState>
      </Card>
    </>
  );
}
