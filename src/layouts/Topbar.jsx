/**
 * Шапка: название текущей страницы, переключатели темы и языка, FAQ, меню пользователя (выход).
 */
import { useState } from "react";
import { useMatches } from "react-router";
import { Bell, CircleHelp, LogIn, LogOut, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import { useGetUsersQuery, userDisplayName, userLoginTime, userRoles } from "@/entities/users/usersApi";
import { formatDateTime } from "@/shared/lib/format";
import { getDisplayName, loggedOut, selectIsAdmin, selectRoles, selectUser } from "@/shared/model/auth";
import { selectTheme, toggleTheme } from "@/shared/model/settings";
import { FaqDialog } from "./FaqDialog";
import { LanguageSwitcher } from "@/shared/ui";

export function Topbar() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);
  const isAdmin = useSelector(selectIsAdmin);
  const [faqOpen, setFaqOpen] = useState(false);

  // Название текущей страницы — из реестра фич
  const feature = useMatches().findLast((m) => m.handle?.feature)?.handle.feature;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-360 items-center gap-3 px-8">
        <div className="min-w-0 flex-1 truncate text-sm font-semibold text-fg-muted">
          {feature && t(feature.titleKey, { ns: feature.ns })}
        </div>

        <LanguageSwitcher />

        <Tooltip title={t("topbar.toggleTheme")}>
          <IconButton onClick={() => dispatch(toggleTheme())}>
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </IconButton>
        </Tooltip>

        <Tooltip title={t("faq.title")}>
          <IconButton onClick={() => setFaqOpen(true)}>
            <CircleHelp className="size-5" />
          </IconButton>
        </Tooltip>

        {isAdmin && <OnlineUsers />}

        <UserMenu />
      </div>

      <FaqDialog open={faqOpen} onClose={() => setFaqOpen(false)} />
    </header>
  );
}

/** Колокольчик администратора: пользователи, вошедшие в систему. Обновляется раз в 30 секунд. */
function OnlineUsers() {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState(null);
  const { data, isLoading } = useGetUsersQuery({ pageNumber: 1, pageSize: 10 }, { pollingInterval: 30_000 });
  const users = data?.items ?? [];

  return (
    <>
      <Tooltip title={t("topbar.users")}>
        <IconButton onClick={(e) => setAnchor(e.currentTarget)}>
          <Badge badgeContent={users.length} color="primary" max={99}>
            <Bell className="size-5" />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 400, maxHeight: 520, mt: 1 } } }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <span className="font-bold">{t("topbar.users")}</span>
          {users.length > 0 && <Chip size="small" color="primary" label={users.length} />}
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-10">
            <CircularProgress size={24} />
          </div>
        ) : users.length === 0 ? (
          <p className="py-10 text-center text-sm text-fg-muted">{t("topbar.noUsers")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {users.map((u, i) => (
              <li key={u.id ?? u.Id ?? i} className="flex gap-3 px-5 py-3">
                <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
                  <LogIn className="size-4.5" />
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">{userDisplayName(u)}</span>
                    <Chip size="small" variant="outlined" color="primary" label={userRoles(u)} />
                  </div>
                  <div className="truncate text-xs text-fg-muted">{u.email ?? u.Email ?? "—"}</div>
                  {userLoginTime(u) && (
                    <div className="mt-0.5 text-xs text-fg-muted">
                      {t("topbar.loginTime")}: {formatDateTime(userLoginTime(u))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Popover>
    </>
  );
}

function UserMenu() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const roles = useSelector(selectRoles);
  const [anchor, setAnchor] = useState(null);
  const name = getDisplayName(user) || "—";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <button
        onClick={(e) => setAnchor(e.currentTarget)}
        className="ml-1 flex items-center gap-3 rounded-xl border-l border-line py-1 pr-1 pl-4 transition hover:bg-muted"
      >
        <div className="text-right leading-tight">
          <div className="text-sm font-bold">{name}</div>
          <div className="text-xs text-fg-muted">{roles.join(", ") || t("user.employee")}</div>
        </div>
        <Avatar sx={{ width: 40, height: 40, bgcolor: "primary.main", fontWeight: 700, fontSize: 14 }}>
          {initials}
        </Avatar>
      </button>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 220, mt: 1 } } }}
      >
        <div className="px-4 py-2">
          <div className="font-bold">{name}</div>
          {user?.email && <div className="text-xs text-fg-muted">{user.email}</div>}
        </div>
        <Divider />
        <MenuItem onClick={() => dispatch(loggedOut())} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ color: "inherit" }}>
            <LogOut className="size-4.5" />
          </ListItemIcon>
          {t("user.logout")}
        </MenuItem>
      </Menu>
    </>
  );
}
