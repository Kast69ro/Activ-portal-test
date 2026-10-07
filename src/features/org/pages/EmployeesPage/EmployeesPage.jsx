import { useMemo, useState } from "react";
import { Mail, Pencil, Phone, Plus, Search, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import {
  ALL,
  employeeName,
  findById,
  useCreateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetDepartmentsQuery,
  useGetEmployeesQuery,
  useGetPositionsQuery,
  useGetSubDepartmentsQuery,
  useUpdateEmployeeMutation,
} from "@/entities/org/orgApi";
import { getErrorMessage } from "@/shared/api/normalize";
import { EmptyState, PageHeader, QueryState, useConfirm, useToast } from "@/shared/ui";
import { selectEmployeeSearch, selectPage, setEmployeeSearch, setPage } from "@/features/org/model/orgSlice";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  departmentId: "",
  subDepartmentId: "",
  positionId: "",
};

export default function EmployeesPage() {
  const { t } = useTranslation("org");
  const dispatch = useDispatch();
  const toast = useToast();
  const confirm = useConfirm();

  // Сотрудников немного — загружаем всех и ищем/листаем на клиенте, как и прежняя система
  const employeesQuery = useGetEmployeesQuery(ALL);
  const { data: departments } = useGetDepartmentsQuery(ALL);
  const { data: subdepartments } = useGetSubDepartmentsQuery(ALL);
  const { data: positions } = useGetPositionsQuery(ALL);
  const [createEmployee] = useCreateEmployeeMutation();
  const [updateEmployee] = useUpdateEmployeeMutation();
  const [deleteEmployee] = useDeleteEmployeeMutation();

  const search = useSelector(selectEmployeeSearch);
  const page = useSelector((s) => selectPage(s, "employees"));

  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const deps = departments?.items ?? [];
  const subs = subdepartments?.items ?? [];
  const pos = positions?.items ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = employeesQuery.data?.items ?? [];
    if (!q) return list;
    return list.filter((e) => [e.firstName, e.lastName, e.email, e.phone].some((v) => v?.toLowerCase().includes(q)));
  }, [employeesQuery.data, search]);

  const rows = filtered.slice((page.pageNumber - 1) * page.pageSize, page.pageNumber * page.pageSize);
  const subOptions = form.departmentId
    ? subs.filter((s) => String(s.departmentId) === String(form.departmentId))
    : subs;

  const openForm = (employee) => {
    setEditing(employee ?? {});
    setTouched(false);
    setForm(employee ? Object.fromEntries(Object.keys(EMPTY_FORM).map((k) => [k, employee[k] ?? ""])) : EMPTY_FORM);
  };

  const invalid = !form.firstName.trim() || !form.lastName.trim();

  const save = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (invalid) return;
    setSaving(true);
    const body = {
      ...form,
      departmentId: form.departmentId || null,
      subDepartmentId: form.subDepartmentId || null,
      positionId: form.positionId || null,
    };
    try {
      if (editing.id != null) await updateEmployee({ id: editing.id, ...body }).unwrap();
      else await createEmployee(body).unwrap();
      toast.success(t(editing.id != null ? "common:toast.saved" : "common:toast.created"));
      setEditing(null);
    } catch (error) {
      toast.error(getErrorMessage(error, t("common:toast.error")));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (employee) => {
    if (!(await confirm({ title: t("employees.deleteConfirm", { name: employeeName(employee) }), danger: true })))
      return;
    try {
      await deleteEmployee(employee.id).unwrap();
      toast.success(t("common:toast.deleted"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("common:toast.error")));
    }
  };

  const field = (name) => ({
    value: form[name],
    onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })),
  });

  const nameOf = (list, id, key = "name") => findById(list, id)?.[key] ?? "—";

  return (
    <>
      <PageHeader
        title={t("employees.title")}
        description={t("common:table.total", { count: employeesQuery.data?.items.length ?? 0 })}
        actions={
          <>
            <TextField
              placeholder={t("employees.search")}
              value={search}
              onChange={(e) => dispatch(setEmployeeSearch(e.target.value))}
              sx={{ width: 300 }}
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
            <Button variant="contained" startIcon={<Plus className="size-4" />} onClick={() => openForm(null)}>
              {t("employees.add")}
            </Button>
          </>
        }
      />

      <Card>
        <QueryState query={employeesQuery}>
          {() =>
            filtered.length === 0 ? (
              <EmptyState title={t("employees.empty")} />
            ) : (
              <>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("common:fields.employee")}</TableCell>
                      <TableCell>{t("common:fields.phone")}</TableCell>
                      <TableCell>{t("common:fields.department")}</TableCell>
                      <TableCell>{t("common:fields.subdepartment")}</TableCell>
                      <TableCell>{t("common:fields.position")}</TableCell>
                      <TableCell align="right" width={110} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((e) => (
                      <TableRow key={e.id} hover onClick={() => setViewing(e)} sx={{ cursor: "pointer" }}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                fontSize: 14,
                                bgcolor: "action.selected",
                                color: "text.secondary",
                              }}
                            >
                              {(e.firstName?.[0] ?? "") + (e.lastName?.[0] ?? "")}
                            </Avatar>
                            <div>
                              <div className="font-semibold">{employeeName(e)}</div>
                              <div className="text-xs text-fg-muted">{e.email || "—"}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{e.phone || "—"}</TableCell>
                        <TableCell>{nameOf(deps, e.departmentId)}</TableCell>
                        <TableCell>{nameOf(subs, e.subDepartmentId)}</TableCell>
                        <TableCell>{nameOf(pos, e.positionId, "title")}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }} onClick={(ev) => ev.stopPropagation()}>
                          <Tooltip title={t("common:actions.edit")}>
                            <IconButton size="small" onClick={() => openForm(e)}>
                              <Pencil className="size-4" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t("common:actions.delete")}>
                            <IconButton size="small" color="error" onClick={() => remove(e)}>
                              <Trash2 className="size-4" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  component="div"
                  count={filtered.length}
                  page={page.pageNumber - 1}
                  rowsPerPage={page.pageSize}
                  rowsPerPageOptions={[10, 20, 50]}
                  onPageChange={(_, p) => dispatch(setPage({ key: "employees", page: { ...page, pageNumber: p + 1 } }))}
                  onRowsPerPageChange={(ev) =>
                    dispatch(setPage({ key: "employees", page: { pageNumber: 1, pageSize: Number(ev.target.value) } }))
                  }
                />
              </>
            )
          }
        </QueryState>
      </Card>

      {/* Карточка сотрудника */}
      <Dialog open={Boolean(viewing)} onClose={() => setViewing(null)} maxWidth="xs" fullWidth>
        {viewing && (
          <>
            <DialogContent sx={{ pt: 4 }}>
              <div className="flex flex-col items-center text-center">
                <Avatar sx={{ width: 72, height: 72, fontSize: 26, bgcolor: "primary.main" }}>
                  {(viewing.firstName?.[0] ?? "") + (viewing.lastName?.[0] ?? "")}
                </Avatar>
                <div className="mt-3 text-xl font-extrabold">{employeeName(viewing)}</div>
                <div className="text-fg-muted">{nameOf(pos, viewing.positionId, "title")}</div>
              </div>
              <div className="mt-6 grid gap-3 text-sm">
                {viewing.email && (
                  <a href={`mailto:${viewing.email}`} className="flex items-center gap-2 text-brand-600">
                    <Mail className="size-4" /> {viewing.email}
                  </a>
                )}
                {viewing.phone && (
                  <a href={`tel:${viewing.phone}`} className="flex items-center gap-2 text-brand-600">
                    <Phone className="size-4" /> {viewing.phone}
                  </a>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Chip label={nameOf(deps, viewing.departmentId)} />
                  <Chip label={nameOf(subs, viewing.subDepartmentId)} variant="outlined" />
                </div>
              </div>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button
                startIcon={<Pencil className="size-4" />}
                onClick={() => {
                  openForm(viewing);
                  setViewing(null);
                }}
              >
                {t("common:actions.edit")}
              </Button>
              <Button variant="contained" onClick={() => setViewing(null)}>
                {t("common:actions.close")}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Добавление / редактирование */}
      <Dialog open={editing !== null} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <form onSubmit={save} noValidate>
          <DialogTitle>{t(editing?.id != null ? "employees.editTitle" : "employees.addTitle")}</DialogTitle>
          <DialogContent className="grid grid-cols-2 gap-4" sx={{ pt: "8px !important" }}>
            <TextField
              label={t("common:fields.firstName")}
              required
              autoFocus
              {...field("firstName")}
              error={touched && !form.firstName.trim()}
            />
            <TextField
              label={t("common:fields.lastName")}
              required
              {...field("lastName")}
              error={touched && !form.lastName.trim()}
            />
            <TextField label={t("common:fields.email")} type="email" {...field("email")} />
            <TextField
              label={t("common:fields.phone")}
              {...field("phone")}
              slotProps={{ htmlInput: { maxLength: 9 } }}
            />
            <TextField
              select
              label={t("common:fields.department")}
              className="col-span-2"
              value={form.departmentId}
              onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value, subDepartmentId: "" }))}
            >
              <MenuItem value="">—</MenuItem>
              {deps.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={t("common:fields.subdepartment")}
              className="col-span-2"
              {...field("subDepartmentId")}
            >
              <MenuItem value="">—</MenuItem>
              {subOptions.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label={t("common:fields.position")} className="col-span-2" {...field("positionId")}>
              <MenuItem value="">—</MenuItem>
              {pos.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.title}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button color="inherit" onClick={() => setEditing(null)}>
              {t("common:actions.cancel")}
            </Button>
            <Button type="submit" variant="contained" loading={saving}>
              {t("common:actions.save")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
