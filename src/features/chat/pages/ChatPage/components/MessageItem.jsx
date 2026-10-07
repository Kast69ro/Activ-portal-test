import { useState } from "react";
import { Check, Clock, Download, MoreHorizontal, Pencil, Plus, SmilePlus, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import TextField from "@mui/material/TextField";
import { cn } from "@/shared/lib/cn";
import { formatTime } from "@/shared/lib/format";
import { useConfirm, useToast } from "@/shared/ui";
import {
  chatApi,
  patchMessages,
  useAddReactionMutation,
  useDeleteMessageMutation,
  useRemoveReactionMutation,
  useUpdateMessageMutation,
} from "@/features/chat/api";
import { EmojiPicker } from "./EmojiPicker";
import { downloadChatFile } from "@/features/chat/model/files";
import { QUICK_REACTIONS } from "@/features/chat/model/utils";
import { FileAttachment } from "./FileAttachment";

export function MessageItem({ msg, chatId, me, isMine, onPreview }) {
  const { t } = useTranslation("chat");
  const dispatch = useDispatch();
  const toast = useToast();
  const confirm = useConfirm();
  const [menu, setMenu] = useState(null);
  const [reactAnchor, setReactAnchor] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const [updateMessage] = useUpdateMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();
  const [addReaction] = useAddReactionMutation();
  const [removeReaction] = useRemoveReactionMutation();

  const myReaction = (emoji) => msg.reactions?.some((r) => r.reaction === emoji && r.user_id === me?.id);

  // У пользователя одна реакция на сообщение: ставим новую и сразу показываем, при ошибке — перезагружаем
  const toggleReaction = async (emoji) => {
    setReactAnchor(null);
    setPickerOpen(false);
    const already = myReaction(emoji);
    dispatch(
      patchMessages(chatId, (draftList) => {
        const m = draftList.find((x) => x.id === msg.id);
        if (!m) return;
        m.reactions = (m.reactions ?? []).filter((r) => r.user_id !== me?.id);
        if (!already)
          m.reactions.push({ id: `temp-${Date.now()}`, message_id: msg.id, reaction: emoji, user_id: me?.id });
      }),
    );
    try {
      if (already) await removeReaction({ messageId: msg.id, reaction: emoji }).unwrap();
      else await addReaction({ messageId: msg.id, reaction: emoji }).unwrap();
    } catch {
      dispatch(chatApi.util.invalidateTags([{ type: "Messages", id: chatId }]));
    }
  };

  const saveEdit = async () => {
    const content = draft.trim();
    if (!content) return;
    try {
      const updated = await updateMessage({ id: msg.id, content }).unwrap();
      dispatch(
        patchMessages(chatId, (list) => {
          const m = list.find((x) => x.id === msg.id);
          if (m) Object.assign(m, { content, is_edited: true }, updated);
        }),
      );
      setEditing(false);
    } catch {
      toast.error(t("editFailed"));
    }
  };

  const remove = async () => {
    setMenu(null);
    if (!(await confirm({ title: t("deleteMessage"), danger: true }))) return;
    try {
      await deleteMessage(msg.id).unwrap();
      dispatch(patchMessages(chatId, (list) => list.filter((m) => m.id !== msg.id)));
    } catch {
      toast.error(t("deleteFailed"));
    }
  };

  const reactions = Object.entries(
    (msg.reactions ?? []).reduce((acc, r) => ({ ...acc, [r.reaction]: (acc[r.reaction] ?? 0) + 1 }), {}),
  );

  return (
    <div className={cn("group mb-3 flex", isMine && "justify-end")}>
      <div
        className={cn(
          "relative max-w-[65%] rounded-2xl px-4 py-2.5",
          isMine ? "rounded-br-md bg-brand-50 dark:bg-brand-900/25" : "rounded-bl-md bg-muted",
        )}
      >
        <div className="mb-0.5 flex items-center justify-between gap-3">
          <span className={cn("text-sm font-bold", isMine ? "text-brand-700 dark:text-brand-300" : "text-fg")}>
            {isMine ? t("you") : msg.sender?.username}
          </span>
          <span className="flex opacity-0 transition-opacity group-hover:opacity-100">
            <IconButton size="small" onClick={(e) => setReactAnchor(e.currentTarget)}>
              <SmilePlus className="size-3.5" />
            </IconButton>
            {(msg.file || isMine) && (
              <IconButton size="small" onClick={(e) => setMenu(e.currentTarget)}>
                <MoreHorizontal className="size-3.5" />
              </IconButton>
            )}
          </span>
        </div>

        {editing ? (
          <div className="flex items-center gap-1">
            <TextField
              size="small"
              autoFocus
              fullWidth
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <IconButton size="small" color="success" onClick={saveEdit}>
              <Check className="size-4" />
            </IconButton>
            <IconButton size="small" onClick={() => setEditing(false)}>
              <X className="size-4" />
            </IconButton>
          </div>
        ) : msg.file ? (
          <FileAttachment file={msg.file} onPreview={onPreview} />
        ) : (
          <p className="text-sm break-words whitespace-pre-wrap">
            {msg.content}
            {msg.is_edited && <span className="ml-1 text-[10px] text-fg-muted">{t("edited")}</span>}
          </p>
        )}

        {reactions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {reactions.map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                className={cn(
                  "rounded-full border px-1.5 py-0.5 text-xs",
                  myReaction(emoji) ? "border-brand-300 bg-card" : "border-transparent bg-card/70",
                )}
              >
                {emoji} {count}
              </button>
            ))}
          </div>
        )}

        <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-fg-muted">
          <Clock className="size-3" />
          {formatTime(msg.created_at)}
        </div>
      </div>

      <Popover
        open={Boolean(reactAnchor)}
        anchorEl={reactAnchor}
        onClose={() => {
          setReactAnchor(null);
          setPickerOpen(false);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {pickerOpen ? (
          <EmojiPicker width={300} height={360} onPick={toggleReaction} />
        ) : (
          <div className="flex items-center gap-1 p-1.5">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                className={cn("rounded-full p-1 text-xl hover:bg-muted", myReaction(emoji) && "bg-muted")}
              >
                {emoji}
              </button>
            ))}
            <IconButton size="small" onClick={() => setPickerOpen(true)}>
              <Plus className="size-4" />
            </IconButton>
          </div>
        )}
      </Popover>

      <Menu anchorEl={menu} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {msg.file && (
          <MenuItem
            onClick={() => {
              setMenu(null);
              downloadChatFile(msg.file).catch(() => toast.error(t("fileFailed")));
            }}
          >
            <ListItemIcon>
              <Download className="size-4" />
            </ListItemIcon>
            {t("common:actions.download")}
          </MenuItem>
        )}
        {isMine && !msg.file && (
          <MenuItem
            onClick={() => {
              setMenu(null);
              setDraft(msg.content ?? "");
              setEditing(true);
            }}
          >
            <ListItemIcon>
              <Pencil className="size-4" />
            </ListItemIcon>
            {t("common:actions.edit")}
          </MenuItem>
        )}
        {isMine && (
          <MenuItem onClick={remove} sx={{ color: "error.main" }}>
            <ListItemIcon sx={{ color: "inherit" }}>
              <Trash2 className="size-4" />
            </ListItemIcon>
            {t("common:actions.delete")}
          </MenuItem>
        )}
      </Menu>
    </div>
  );
}
