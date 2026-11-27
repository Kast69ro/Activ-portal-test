/**
 * Общий CRUD-справочник для DepartmentsPage, SubDepartmentsPage и PositionsPage
 * (до рефакторинга — DirectoryPage.jsx).
 */
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
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
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { getErrorMessage } from "@/shared/api/normalize";
import { EmptyState, PageHeader, QueryState, useConfirm, useToast } from "@/shared/ui";
import { useRetained } from "@/shared/lib/useRetained";

/**
 * Справочник с CRUD: таблица, постраничный вывод, диалог добавления/редактирования.
 * Используется для управлений, отделов и должностей — у них одинаковое поведение.
 *
 * config: {
 *   title, description, addLabel, emptyLabel, deleteTitle(item),
 *   query,                        // результат useGet…Query({ pageNumber, pageSize })
 *   create, update, remove,       // триггеры мутаций RTK Query
 *   columns: [{ key, label, render(item) }],
 *   fields:  [{ name, label, options?: [{ value, label }] }],
 *   toForm(item) → values, toPayload(values, item) → body
 * }
 */
export function DirectoryTable({ config, page, onPageChange }) {
  const { t } = useTranslation("org");
  const toast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(null); // null — закрыт, {} — новый, item — редактирование
  // Диалоги ниже показывают последнее значение, пока закрываются, — иначе содержимое пропадёт до конца анимации
  const shownEditing = useRetained(editing);
  const [values, setValues] = useState({});
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const open = (item) => {
    setEditing(item ?? {});
    setValues(config.toForm(item ?? {}));
    setTouched(false);
  };

  const invalid = config.fields.some((f) => !String(values[f.name] ?? "").trim());

  const save = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (invalid) return;
    setSaving(true);
    try {
      const body = config.toPayload(values, editing);
      if (editing.id != null) await config.update({ id: editing.id, ...body }).unwrap();
      else await config.create(body).unwrap();
      toast.success(t(editing.id != null ? "common:toast.saved" : "common:toast.created"));
      setEditing(null);
    } catch (error) {
      toast.error(getErrorMessage(error, t("common:toast.error")));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!(await confirm({ title: config.deleteTitle(item), danger: true }))) return;
    try {
      await config.remove(item.id).unwrap();
      toast.success(t("common:toast.deleted"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("common:toast.error")));
    }
  };

  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <Button variant="contained" startIcon={<Plus className="size-4" />} onClick={() => open(null)}>
            {config.addLabel}
          </Button>
        }
      />

      <Card>
        <QueryState query={config.query}>
          {({ items, total }) =>
            items.length === 0 ? (
              <EmptyState title={config.emptyLabel} />
            ) : (
              <>
                <Table>
                  <TableHead>
                    <TableRow>
                      {config.columns.map((c) => (
                        <TableCell key={c.key}>{c.label}</TableCell>
                      ))}
                      <TableCell align="right" width={120}>
                        {t("common:fields.actions")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} hover>
                        {config.columns.map((c) => (
                          <TableCell key={c.key}>{c.render(item)}</TableCell>
                        ))}
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <Tooltip title={t("common:actions.edit")}>
                            <IconButton size="small" onClick={() => open(item)}>
                              <Pencil className="size-4" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t("common:actions.delete")}>
                            <IconButton size="small" color="error" onClick={() => remove(item)}>
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
                  count={total}
                  page={page.pageNumber - 1}
                  rowsPerPage={page.pageSize}
                  rowsPerPageOptions={[5, 10, 20, 50]}
                  onPageChange={(_, p) => onPageChange({ ...page, pageNumber: p + 1 })}
                  onRowsPerPageChange={(e) => onPageChange({ pageNumber: 1, pageSize: Number(e.target.value) })}
                />
              </>
            )
          }
        </QueryState>
      </Card>

      <Dialog open={editing !== null} onClose={() => setEditing(null)} maxWidth="xs" fullWidth>
        <form onSubmit={save} noValidate>
          <DialogTitle>{t(shownEditing?.id != null ? "common:actions.edit" : "common:actions.add")}</DialogTitle>
          <DialogContent className="grid gap-4" sx={{ pt: "8px !important" }}>
            {config.fields.map((f) => {
              const error = touched && !String(values[f.name] ?? "").trim();
              return (
                <TextField
                  key={f.name}
                  label={f.label}
                  required
                  autoFocus={f === config.fields[0]}
                  select={Boolean(f.options)}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  error={error}
                  helperText={error ? t("common:fields.required") : undefined}
                >
                  {f.options?.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              );
            })}
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
