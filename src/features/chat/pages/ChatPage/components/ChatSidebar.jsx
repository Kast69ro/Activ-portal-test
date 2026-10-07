import { useMemo, useState } from "react";
import { Search, UsersRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import { getErrorMessage } from "@/shared/api/normalize";
import { cn } from "@/shared/lib/cn";
import { formatRelativeDay } from "@/shared/lib/format";
import { useDebounce } from "@/shared/lib/useDebounce";
import { selectLogin } from "@/shared/model/auth";
import { useToast } from "@/shared/ui";
import { useCreateChatMutation, useGetChatsQuery, useMarkReadMutation, useSearchUsersQuery } from "@/features/chat/api";
import { openChat, selectActiveChatId, selectChatType, selectOnlineUserIds, setChatType } from "@/features/chat/model/chatSlice";
import { avatarSrc, getPeer, initialOf, messagePreview } from "@/features/chat/model/utils";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { UserHeader } from "./UserHeader";

export function ChatSidebar({ me }) {
  const { t } = useTranslation("chat");
  const dispatch = useDispatch();
  const toast = useToast();
  const login = useSelector(selectLogin);
  const chatType = useSelector(selectChatType);
  const activeChatId = useSelector(selectActiveChatId);
  const online = useSelector(selectOnlineUserIds);

  const [search, setSearch] = useState("");
  const [groupOpen, setGroupOpen] = useState(false);
  const debounced = useDebounce(search.trim(), 400);

  const { data: chats = [], isLoading, isError, error } = useGetChatsQuery(chatType);
  const { data: users = [], isFetching: searching } = useSearchUsersQuery(debounced, { skip: !debounced });
  const [createChat] = useCreateChatMutation();
  const [markRead] = useMarkReadMutation();

  const filtered = useMemo(
    () => chats.filter((c) => (c.name ?? "").toLowerCase().includes(search.trim().toLowerCase())),
    [chats, search],
  );

  // Среди найденных сотрудников — только те, с кем ещё нет личного чата
  const newUsers = useMemo(() => {
    const existing = new Set(chats.map((c) => getPeer(c, login)?.username).filter(Boolean));
    return users.filter((u) => !existing.has(u.username) && u.username !== login);
  }, [users, chats, login]);

  const select = (chat) => {
    dispatch(openChat(chat.id));
    if (chat.unread_count > 0 && chat.last_message?.id)
      markRead({ chatId: chat.id, lastMessageId: chat.last_message.id });
  };

  const startDirect = async (user) => {
    try {
      const chat = await createChat({ type: "direct", member_ids: [user.id] }).unwrap();
      setSearch("");
      if (chatType !== "direct") dispatch(setChatType("direct"));
      if (chat?.id) dispatch(openChat(chat.id));
    } catch (e) {
      toast.error(getErrorMessage(e, t("createFailed")));
    }
  };

  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-r border-line">
      <div className="space-y-4 border-b border-line p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">{t("title")}</h1>
            <p className="text-sm text-fg-muted">{t("dialogs", { count: chats.length })}</p>
          </div>
          <UserHeader me={me} />
        </div>
        <div className="flex gap-2">
          <TextField
            fullWidth
            placeholder={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          <Tooltip title={t("group.create")}>
            <IconButton onClick={() => setGroupOpen(true)} sx={{ border: 1, borderColor: "divider", borderRadius: 3 }}>
              <UsersRound className="size-5" />
            </IconButton>
          </Tooltip>
        </div>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={chatType}
          onChange={(_, v) => v && dispatch(setChatType(v))}
        >
          <ToggleButton value="direct">{t("tabs.direct")}</ToggleButton>
          <ToggleButton value="group">{t("tabs.group")}</ToggleButton>
        </ToggleButtonGroup>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading && (
          <div className="grid h-40 place-items-center">
            <CircularProgress size={24} />
          </div>
        )}
        {isError && <p className="p-5 text-center text-sm text-red-500">{getErrorMessage(error, t("loadFailed"))}</p>}

        {filtered.map((chat) => {
          const peer = getPeer(chat, login);
          const peerId = peer?.id ?? peer?.user_id;
          const avatar = peer?.avatar_url || chat.avatar_url;
          return (
            <button
              key={chat.id}
              onClick={() => select(chat)}
              className={cn(
                "flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors",
                activeChatId === chat.id ? "bg-brand-50 dark:bg-brand-900/20" : "hover:bg-muted",
              )}
            >
              <Badge
                overlap="circular"
                variant="dot"
                color="success"
                invisible={peerId == null || !online.includes(peerId)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              >
                <Avatar src={avatarSrc(avatar)} sx={{ width: 48, height: 48 }}>
                  {initialOf(chat.name)}
                </Avatar>
              </Badge>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold">{chat.name}</span>
                  <span className="shrink-0 text-xs text-fg-muted">
                    {formatRelativeDay(chat.last_message?.created_at || chat.updated_at, t("common:time.yesterday"))}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="truncate text-sm text-fg-muted">{messagePreview(chat.last_message, t)}</span>
                  {chat.unread_count > 0 && (
                    <span className="rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">
                      {chat.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {!isLoading && !search && filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-fg-muted">{t("empty")}</p>
        )}

        {search.trim() && (
          <div className="border-t border-line py-2">
            <div className="px-5 py-1 text-[11px] font-bold tracking-wider text-fg-muted uppercase">
              {t("employees")}
            </div>
            {searching && (
              <div className="grid place-items-center py-3">
                <CircularProgress size={18} />
              </div>
            )}
            {!searching && newUsers.length === 0 && <p className="px-5 py-2 text-sm text-fg-muted">{t("nobody")}</p>}
            {!searching &&
              newUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => startDirect(u)}
                  className="flex w-full items-center gap-3 px-5 py-2.5 text-left hover:bg-muted"
                >
                  <Badge overlap="circular" variant="dot" color="success" invisible={!online.includes(u.id)}>
                    <Avatar src={avatarSrc(u.avatar_url)} sx={{ width: 40, height: 40 }}>
                      {initialOf(u.username)}
                    </Avatar>
                  </Badge>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{u.full_name || u.username}</div>
                    <div className="truncate text-xs text-fg-muted">@{u.username}</div>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      <CreateGroupDialog
        open={groupOpen}
        onClose={() => setGroupOpen(false)}
        onCreated={(chat) => {
          dispatch(setChatType("group"));
          if (chat?.id) dispatch(openChat(chat.id));
        }}
      />
    </aside>
  );
}
