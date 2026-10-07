/**
 * Выбор сотрудников. Используют CreateGroupDialog и MembersDialog.
 */
import { useState } from "react";
import { Check, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { cn } from "@/shared/lib/cn";
import { useDebounce } from "@/shared/lib/useDebounce";
import { selectLogin } from "@/shared/model/auth";
import { useSearchUsersQuery } from "@/features/chat/api";
import { avatarSrc, initialOf } from "@/features/chat/model/utils";

/** Поиск и множественный выбор сотрудников для группы. exclude — логины, которых не показывать */
export function UserPicker({ selected, onChange, exclude = [] }) {
  const { t } = useTranslation("chat");
  const login = useSelector(selectLogin);
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search.trim(), 400);
  const { data: users = [], isFetching } = useSearchUsersQuery(debounced, { skip: !debounced });

  const results = users.filter((u) => u.username !== login && !exclude.includes(u.username));
  const isSelected = (u) => selected.some((s) => s.id === u.id);
  const toggle = (u) => onChange(isSelected(u) ? selected.filter((s) => s.id !== u.id) : [...selected, u]);

  return (
    <div>
      {selected.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {selected.map((u) => (
            <Chip
              key={u.id}
              color="primary"
              variant="outlined"
              avatar={<Avatar src={avatarSrc(u.avatar_url)}>{initialOf(u.username)}</Avatar>}
              label={u.username}
              onDelete={() => toggle(u)}
            />
          ))}
        </div>
      )}
      <TextField
        fullWidth
        placeholder={t("group.findEmployee")}
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
      <div className="mt-2 max-h-64 min-h-10 overflow-y-auto">
        {isFetching && (
          <div className="grid place-items-center py-4">
            <CircularProgress size={18} />
          </div>
        )}
        {!isFetching && debounced && results.length === 0 && (
          <p className="py-3 text-center text-sm text-fg-muted">{t("nobody")}</p>
        )}
        {!isFetching &&
          results.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => toggle(u)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-muted",
                isSelected(u) && "bg-brand-50/70 dark:bg-brand-900/15",
              )}
            >
              <Avatar src={avatarSrc(u.avatar_url)} sx={{ width: 36, height: 36 }}>
                {initialOf(u.username)}
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{u.full_name || u.username}</div>
                <div className="truncate text-xs text-fg-muted">@{u.username}</div>
              </div>
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full border-2",
                  isSelected(u) ? "border-brand-600 bg-brand-600 text-white" : "border-line",
                )}
              >
                {isSelected(u) && <Check className="size-3" />}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}
