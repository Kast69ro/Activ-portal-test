/**
 * Диалог папки базы знаний. Используется в LibraryView (то есть на обеих страницах домена).
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useCreateFolderMutation, useUpdateFolderMutation } from "@/entities/knowledge/knowledgeApi";
import { getErrorMessage } from "@/shared/api/normalize";
import { useToast } from "@/shared/ui";

/** Создание и переименование папки. folder = {} — новая */
export function FolderDialog({ open, folder, folderType, onClose, onCreated }) {
  const { t } = useTranslation("knowledge");
  const toast = useToast();
  const [name, setName] = useState("");
  const [create, createState] = useCreateFolderMutation();
  const [update, updateState] = useUpdateFolderMutation();
  const isEdit = folder?.id != null;

  useEffect(() => {
    if (open) setName(folder?.name ?? "");
  }, [open, folder]);

  const save = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      if (isEdit) {
        await update({ id: folder.id, ...folder, name: name.trim(), folderType }).unwrap();
      } else {
        const created = await create({ name: name.trim(), folderType }).unwrap();
        onCreated?.(created);
      }
      toast.success(t(isEdit ? "common:toast.saved" : "common:toast.created"));
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, t("common:toast.error")));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={save}>
        <DialogTitle>{t(isEdit ? "folder.rename" : "folder.add")}</DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <TextField
            label={t("folder.name")}
            fullWidth
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!name.trim()}
            loading={createState.isLoading || updateState.isLoading}
          >
            {t("common:actions.save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
