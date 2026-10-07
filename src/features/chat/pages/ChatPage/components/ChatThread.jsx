/**
 * Переписка открытого чата: сообщения, ввод, вложения, управление группой. Используется в ChatPage.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  MessagesSquare,
  MoreVertical,
  Paperclip,
  Pencil,
  SendHorizontal,
  Settings,
  Smile,
  Trash2,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { getErrorMessage } from "@/shared/api/normalize";
import { formatDate } from "@/shared/lib/format";
import { selectLogin } from "@/shared/model/auth";
import { EmptyState, FilePreviewDialog, useConfirm, useToast } from "@/shared/ui";
import {
  patchChats,
  patchMessages,
  useDeleteChatMutation,
  useGetChatQuery,
  useGetChatsQuery,
  useGetMessagesQuery,
  useSendFileMutation,
  useSendMessageMutation,
  useUpdateChatMutation,
} from "@/features/chat/api";
import { openChat, selectActiveChatId, selectChatType, selectOnlineUserIds, selectTypingIds } from "@/features/chat/model/chatSlice";
import { sendSocket } from "@/features/chat/model/socket";
import { avatarSrc, getPeer, groupByDay, initialOf } from "@/features/chat/model/utils";
import { EmojiPicker } from "./EmojiPicker";
import { MembersDialog } from "./MembersDialog";
import { MessageItem } from "./MessageItem";
import { RenameDialog } from "./RenameDialog";

const TYPING_IDLE = 3000;

export function ChatThread({ me }) {
  const { t } = useTranslation("chat");
  const dispatch = useDispatch();
  const toast = useToast();
  const confirm = useConfirm();
  const login = useSelector(selectLogin);
  const chatId = useSelector(selectActiveChatId);
  const chatType = useSelector(selectChatType);
  const online = useSelector(selectOnlineUserIds);
  const typingIds = useSelector((s) => selectTypingIds(s, chatId));

  // Полная карточка чата (с участниками); пока грузится — берём запись из списка
  const { data: list = [] } = useGetChatsQuery(chatType);
  const { data: full } = useGetChatQuery(chatId, { skip: !chatId });
  const chat = full ?? list.find((c) => c.id === chatId);
  const { data: messages = [], isLoading } = useGetMessagesQuery(chatId, { skip: !chatId });

  const [sendMessage, sendState] = useSendMessageMutation();
  const [sendFile, fileState] = useSendFileMutation();
  const [updateChat] = useUpdateChatMutation();
  const [deleteChat] = useDeleteChatMutation();

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const [menu, setMenu] = useState(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [preview, setPreview] = useState(null);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingRef = useRef({ active: false, timer: null });

  const lastId = messages[messages.length - 1]?.id;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastId, chatId]);

  // Сбрасываем «печатает…» при смене чата и уходе со страницы
  useEffect(() => {
    const typing = typingRef.current;
    return () => {
      clearTimeout(typing.timer);
      if (typing.active && chatId) sendSocket("typing", { chat_id: chatId, is_typing: false });
      typing.active = false;
    };
  }, [chatId]);

  // Превью вложений (blob:-ссылки) освобождаем, когда список меняется
  const previews = useMemo(
    () =>
      files.map((f) => (f.type.startsWith("image/") || f.type.startsWith("video/") ? URL.createObjectURL(f) : null)),
    [files],
  );
  useEffect(() => () => previews.forEach((u) => u && URL.revokeObjectURL(u)), [previews]);

  if (!chatId || !chat) {
    return (
      <div className="grid flex-1 place-items-center">
        <EmptyState icon={MessagesSquare} title={t("selectChat")} description={t("selectChatHint")} />
      </div>
    );
  }

  const isGroup = chat.type === "group";
  const peer = getPeer(chat, login);
  const peerId = peer?.id ?? peer?.user_id;
  const peerOnline = peerId != null && online.includes(peerId);
  const title = peer?.username || chat.name;

  const typingNames = typingIds
    .filter((id) => id !== me?.id)
    .map((id) => chat.members?.find((m) => (m.user_id ?? m.user?.id) === id)?.user?.username)
    .filter(Boolean);

  const stopTyping = () => {
    clearTimeout(typingRef.current.timer);
    if (typingRef.current.active) sendSocket("typing", { chat_id: chatId, is_typing: false });
    typingRef.current.active = false;
  };

  const handleChange = (value) => {
    setText(value);
    if (!value.trim()) return stopTyping();
    if (!typingRef.current.active) {
      sendSocket("typing", { chat_id: chatId, is_typing: true });
      typingRef.current.active = true;
    }
    clearTimeout(typingRef.current.timer);
    typingRef.current.timer = setTimeout(stopTyping, TYPING_IDLE);
  };

  /** Добавить отправленное сообщение в кэш (для REST-пути — по сокету оно придёт само) */
  const appendLocal = (message) => {
    if (!message?.id) return;
    dispatch(
      patchMessages(chatId, (draft) => {
        if (!draft.some((m) => m.id === message.id)) draft.push(message);
      }),
    );
    dispatch(
      patchChats((draft) => {
        const c = draft.find((x) => x.id === chatId);
        if (c) c.last_message = message;
      }),
    );
  };

  const send = async () => {
    const content = text.trim();
    if (!content && files.length === 0) return;
    stopTyping();
    const toSend = files;
    setText("");
    setFiles([]);
    try {
      // Основной путь — сокет; сообщение вернётся событием new_message
      if (content && !sendSocket("send_message", { chat_id: chatId, content })) {
        appendLocal(await sendMessage({ chatId, content }).unwrap());
      }
      for (const file of toSend) appendLocal(await sendFile({ chatId, file }).unwrap());
    } catch (error) {
      setText(content);
      setFiles(toSend);
      toast.error(getErrorMessage(error, t("sendFailed")));
    }
  };

  const rename = async (name) => {
    try {
      await updateChat({ id: chatId, name }).unwrap();
      return true;
    } catch {
      toast.error(t("group.renameFailed"));
      return false;
    }
  };

  const remove = async () => {
    setMenu(null);
    if (
      !(await confirm({ title: t(isGroup ? "deleteGroup" : "deleteChat"), description: t("cannotUndo"), danger: true }))
    )
      return;
    try {
      await deleteChat(chatId).unwrap();
      dispatch(openChat(null));
    } catch {
      toast.error(t("deleteFailed"));
    }
  };

  const sending = sendState.isLoading || fileState.isLoading;

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-line px-6 py-3.5">
        <Badge
          overlap="circular"
          variant="dot"
          color="success"
          invisible={!peerOnline}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Avatar src={avatarSrc(peer?.avatar_url || chat.avatar_url)} sx={{ width: 42, height: 42 }}>
            {initialOf(title)}
          </Avatar>
        </Badge>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{title}</div>
          <div className="text-xs text-fg-muted">
            {isGroup ? t("group.members", { count: chat.members?.length ?? 0 }) : t(peerOnline ? "online" : "offline")}
          </div>
        </div>
        {isGroup && (
          <Tooltip title={t("group.membersTitle")}>
            <IconButton onClick={() => setMembersOpen(true)}>
              <Settings className="size-5" />
            </IconButton>
          </Tooltip>
        )}
        <IconButton onClick={(e) => setMenu(e.currentTarget)}>
          <MoreVertical className="size-5" />
        </IconButton>
        <Menu anchorEl={menu} open={Boolean(menu)} onClose={() => setMenu(null)}>
          {isGroup && (
            <MenuItem
              onClick={() => {
                setMenu(null);
                setRenameOpen(true);
              }}
            >
              <ListItemIcon>
                <Pencil className="size-4" />
              </ListItemIcon>
              {t("group.rename")}
            </MenuItem>
          )}
          <MenuItem onClick={remove} sx={{ color: "error.main" }}>
            <ListItemIcon sx={{ color: "inherit" }}>
              <Trash2 className="size-4" />
            </ListItemIcon>
            {t(isGroup ? "deleteGroup" : "deleteChat")}
          </MenuItem>
        </Menu>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {isLoading ? (
          <div className="grid h-full place-items-center">
            <CircularProgress size={26} />
          </div>
        ) : (
          groupByDay(messages).map((group) => (
            <div key={group.day}>
              <div className="my-4 flex items-center gap-3 text-xs text-fg-muted">
                <span className="h-px flex-1 bg-line" />
                {formatDate(group.day, { day: "numeric", month: "long" })}
                <span className="h-px flex-1 bg-line" />
              </div>
              {group.items.map((msg) => (
                <MessageItem
                  key={msg.id}
                  msg={msg}
                  chatId={chatId}
                  me={me}
                  isMine={
                    me ? msg.sender_id === me.id || msg.sender?.username === login : msg.sender?.username === login
                  }
                  onPreview={setPreview}
                />
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="h-5 px-6 text-xs text-fg-muted">
        {typingNames.length > 0 &&
          t(typingNames.length === 1 ? "typingOne" : "typingMany", { names: typingNames.join(", ") })}
      </div>

      {files.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-t border-line px-6 pt-3">
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} className="relative shrink-0 rounded-lg border border-line bg-muted p-1">
              {file.type.startsWith("image/") ? (
                <img src={previews[i]} alt={file.name} className="size-16 rounded-md object-cover" />
              ) : file.type.startsWith("video/") ? (
                <video src={previews[i]} muted className="size-16 rounded-md object-cover" />
              ) : (
                <div className="grid size-16 place-items-center text-fg-muted">
                  <FileText className="size-6" />
                  <span className="max-w-14 truncate text-[10px]">{file.name}</span>
                </div>
              )}
              <button
                onClick={() => setFiles((list) => list.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-ink-800 text-white"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 border-t border-line px-6 py-4">
        <TextField
          fullWidth
          multiline
          maxRows={5}
          placeholder={t("placeholder")}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            // Enter — отправить, Shift+Enter — новая строка
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          slotProps={{ input: { sx: { borderRadius: 6 } } }}
        />
        <IconButton onClick={(e) => setEmojiAnchor(e.currentTarget)}>
          <Smile className="size-5" />
        </IconButton>
        <IconButton onClick={() => fileInputRef.current?.click()} disabled={sending}>
          <Paperclip className="size-5" />
        </IconButton>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            setFiles((list) => [...list, ...Array.from(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
        <Button
          variant="contained"
          endIcon={<SendHorizontal className="size-4" />}
          loading={sending}
          disabled={!text.trim() && files.length === 0}
          onClick={send}
          sx={{ borderRadius: 6, px: 2.5, height: 40 }}
        >
          {t("send")}
        </Button>
      </div>

      <Popover
        open={Boolean(emojiAnchor)}
        anchorEl={emojiAnchor}
        onClose={() => setEmojiAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <EmojiPicker onPick={(emoji) => setText((v) => v + emoji)} />
      </Popover>

      <RenameDialog open={renameOpen} initial={chat.name} onClose={() => setRenameOpen(false)} onSubmit={rename} />
      <MembersDialog open={membersOpen} chatId={chatId} me={me} onClose={() => setMembersOpen(false)} />
      <FilePreviewDialog file={preview} onClose={() => setPreview(null)} />
    </section>
  );
}
