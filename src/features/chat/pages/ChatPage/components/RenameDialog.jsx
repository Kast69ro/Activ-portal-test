/**
 * Диалог переименования группового чата. Используется в ChatThread.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

export function RenameDialog({ open, initial, onClose, onSubmit }) {
  const { t } = useTranslation("chat");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setName(initial ?? "");
  }, [open, initial]);

  const submit = async (e) => {
    e.preventDefault();
    const value = name.trim();
    if (!value || value === initial) return onClose();
    setSaving(true);
    const ok = await onSubmit(value);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={submit}>
        <DialogTitle>{t("group.rename")}</DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <TextField
            fullWidth
            autoFocus
            label={t("group.name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button type="submit" variant="contained" loading={saving} disabled={!name.trim()}>
            {t("common:actions.save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
