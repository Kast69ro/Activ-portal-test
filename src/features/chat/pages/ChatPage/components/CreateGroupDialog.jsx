/**
 * Диалог создания группового чата. Используется в ChatSidebar.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { getErrorMessage } from "@/shared/api/normalize";
import { useToast } from "@/shared/ui";
import { useCreateChatMutation } from "@/features/chat/api";
import { UserPicker } from "./UserPicker";

const MIN_MEMBERS = 2;

export function CreateGroupDialog({ open, onClose, onCreated }) {
  const { t } = useTranslation("chat");
  const toast = useToast();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);
  const [createChat, { isLoading }] = useCreateChatMutation();

  const close = () => {
    setName("");
    setSelected([]);
    onClose();
  };

  const create = async () => {
    try {
      const chat = await createChat({
        type: "group",
        name: name.trim(),
        member_ids: selected.map((u) => u.id),
      }).unwrap();
      onCreated?.(chat);
      close();
    } catch (error) {
      toast.error(getErrorMessage(error, t("createFailed")));
    }
  };

  const missing = MIN_MEMBERS - selected.length;

  return (
    <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
      <DialogTitle>
        {t("group.new")}
        <div className="text-sm font-normal text-fg-muted">{t("group.newHint")}</div>
      </DialogTitle>
      <DialogContent className="grid gap-3" sx={{ pt: "8px !important" }}>
        <TextField label={t("group.name")} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        {selected.length > 0 && missing > 0 && (
          <p className="text-xs text-fg-muted">{t("group.needMore", { count: missing, min: MIN_MEMBERS })}</p>
        )}
        <UserPicker selected={selected} onChange={setSelected} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="inherit" onClick={close}>
          {t("common:actions.cancel")}
        </Button>
        <Button variant="contained" loading={isLoading} disabled={!name.trim() || missing > 0} onClick={create}>
          {t("common:actions.create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
