import { useEffect, useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import {
  announcementFiles,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
} from "@/entities/knowledge/knowledgeApi";
import { ALL, employeeName, findById, useGetEmployeesQuery, useGetSubDepartmentsQuery } from "@/entities/org/orgApi";
import { getErrorMessage } from "@/shared/api/normalize";
import { fileName } from "@/shared/lib/files";
import { useToast } from "@/shared/ui";

/** Добавление и редактирование материала базы знаний (видеоурок или документ) */
export function MaterialDialog({ open, item, library, accept, folders, defaultFolderId, onClose }) {
  const { t } = useTranslation("knowledge");
  const toast = useToast();
  const inputRef = useRef(null);
  const { data: employees } = useGetEmployeesQuery(ALL);
  const { data: subdepartments } = useGetSubDepartmentsQuery(ALL);
  const [create, createState] = useCreateAnnouncementMutation();
  const [update, updateState] = useUpdateAnnouncementMutation();

  const isEdit = item?.id != null;
  const [form, setForm] = useState({});
  const [files, setFiles] = useState([]);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      title: item?.title ?? "",
      content: item?.content ?? "",
      folderId: item?.folderId ?? defaultFolderId ?? "",
      subDepartmentId: item?.subDepartmentId ?? "",
      employeeId: item?.employeeId ?? null,
    });
    setFiles([]);
    setTouched(false);
  }, [open, item, defaultFolderId]);

  const invalid = !form.title?.trim() || !form.content?.trim();

  const save = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (invalid) return;
    const data = {
      title: form.title.trim(),
      content: form.content.trim(),
      folderId: form.folderId || 0,
      subDepartmentId: form.subDepartmentId || 0,
      employeeId: form.employeeId || 0,
      files,
    };
    try {
      if (isEdit) await update({ id: item.id, ...data }).unwrap();
      else await create(data).unwrap();
      toast.success(t(isEdit ? "common:toast.saved" : `${library}.published`));
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, t("common:toast.error")));
    }
  };

  const existing = isEdit ? announcementFiles(item) : [];
  const employeeList = employees?.items ?? [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={save} noValidate>
        <DialogTitle>{t(isEdit ? `${library}.editTitle` : `${library}.add`)}</DialogTitle>
        <DialogContent className="grid grid-cols-2 gap-4" sx={{ pt: "8px !important" }}>
          <TextField
            label={t("fields.title")}
            required
            autoFocus
            className="col-span-2"
            value={form.title ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            error={touched && !form.title?.trim()}
          />
          <TextField
            label={t("fields.content")}
            required
            multiline
            minRows={4}
            className="col-span-2"
            value={form.content ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            error={touched && !form.content?.trim()}
          />
          <TextField
            select
            label={t("fields.folder")}
            value={form.folderId ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, folderId: e.target.value }))}
          >
            <MenuItem value="">{t("folder.none")}</MenuItem>
            {folders.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={t("common:fields.subdepartment")}
            value={form.subDepartmentId ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, subDepartmentId: e.target.value }))}
          >
            <MenuItem value="">—</MenuItem>
            {(subdepartments?.items ?? []).map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
          <Autocomplete
            className="col-span-2"
            options={employeeList}
            value={findById(employeeList, form.employeeId) ?? null}
            onChange={(_, v) => setForm((f) => ({ ...f, employeeId: v?.id ?? null }))}
            getOptionLabel={employeeName}
            isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
            renderInput={(params) => <TextField {...params} label={t("fields.author")} />}
          />

          <div className="col-span-2">
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={accept}
              hidden
              onChange={(e) => {
                setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]);
                e.target.value = "";
              }}
            />
            <Button
              variant="outlined"
              startIcon={<Paperclip className="size-4" />}
              onClick={() => inputRef.current?.click()}
            >
              {t("fields.attach")}
            </Button>
            <div className="mt-3 flex flex-wrap gap-2">
              {existing.map((p) => (
                <Chip key={p} label={fileName(p)} variant="outlined" />
              ))}
              {files.map((f, i) => (
                <Chip
                  key={`${f.name}-${i}`}
                  label={f.name}
                  color="primary"
                  onDelete={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  deleteIcon={<X className="size-3.5" />}
                />
              ))}
            </div>
            {isEdit && existing.length > 0 && <p className="mt-2 text-xs text-fg-muted">{t("fields.attachHint")}</p>}
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button type="submit" variant="contained" loading={createState.isLoading || updateState.isLoading}>
            {t(isEdit ? "common:actions.save" : "publish")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
