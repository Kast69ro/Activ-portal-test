import { useState } from "react";
import { ChevronDown, Crown, Trash2, UserPlus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { selectLogin } from "@/shared/model/auth";
import { useConfirm, useToast } from "@/shared/ui";
import {
  useAddMemberMutation,
  useGetMembersQuery,
  useRemoveMemberMutation,
  useUpdateMemberRoleMutation,
} from "../chatApi";
import { avatarSrc, initialOf } from "../utils";
import { UserPicker } from "./UserPicker";

const ROLE_COLOR = { owner: "primary", admin: "info", member: "default" };

/** Участники группы. Владелец меняет роли и удаляет всех, админ — только обычных участников. */
export function MembersDialog({ open, chatId, onClose }) {
  const { t } = useTranslation("chat");
  const toast = useToast();
  const confirm = useConfirm();
  const login = useSelector(selectLogin);
  const { data: members = [], isLoading } = useGetMembersQuery(chatId, { skip: !open || !chatId });
  const [updateRole] = useUpdateMemberRoleMutation();
  const [removeMember] = useRemoveMemberMutation();
  const [addMember] = useAddMemberMutation();

  const [search, setSearch] = useState("");
  const [roleMenu, setRoleMenu] = useState(null); // { anchor, member }
  const [adding, setAdding] = useState(false);
  const [toAdd, setToAdd] = useState([]);
  const [busy, setBusy] = useState(false);

  const self = members.find((m) => m.user?.username === login);
  const isOwner = self?.role === "owner";
  const isAdmin = self?.role === "admin";

  const filtered = members.filter((m) => (m.user?.username ?? "").toLowerCase().includes(search.trim().toLowerCase()));

  const changeRole = async (member, role) => {
    setRoleMenu(null);
    try {
      await updateRole({ chatId, userId: member.user_id, role }).unwrap();
    } catch {
      toast.error(t("group.roleFailed"));
    }
  };

  const remove = async (member) => {
    if (!(await confirm({ title: t("group.removeConfirm", { name: member.user?.username }), danger: true }))) return;
    try {
      await removeMember({ chatId, userId: member.user_id }).unwrap();
    } catch {
      toast.error(t("group.removeFailed"));
    }
  };

  const addSelected = async () => {
    setBusy(true);
    try {
      for (const user of toAdd) await addMember({ chatId, userId: user.id }).unwrap();
      setToAdd([]);
      setAdding(false);
    } catch {
      toast.error(t("group.addFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <span className="flex-1">
          {t("group.membersTitle")}
          <span className="ml-2 text-sm font-medium text-fg-muted">{members.length}</span>
        </span>
        {(isOwner || isAdmin) && !adding && (
          <Button size="small" startIcon={<UserPlus className="size-4" />} onClick={() => setAdding(true)}>
            {t("group.addMembers")}
          </Button>
        )}
        <IconButton onClick={onClose}>
          <X className="size-5" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {adding ? (
          <UserPicker
            selected={toAdd}
            onChange={setToAdd}
            exclude={members.map((m) => m.user?.username).filter(Boolean)}
          />
        ) : (
          <>
            {members.length > 4 && (
              <TextField
                fullWidth
                placeholder={t("group.findMember")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mb: 2 }}
              />
            )}
            {isLoading && (
              <div className="grid place-items-center py-8">
                <CircularProgress size={22} />
              </div>
            )}
            <ul className="divide-y divide-line">
              {filtered.map((m) => {
                const isSelf = m.user?.username === login;
                const canManage = !isSelf && m.role !== "owner" && (isOwner || (isAdmin && m.role !== "admin"));
                const canChangeRole = isOwner && !isSelf && m.role !== "owner";
                return (
                  <li key={m.user_id} className="flex items-center gap-3 py-2.5">
                    <Badge overlap="circular" variant="dot" color="success" invisible={!m.user?.is_online}>
                      <Avatar src={avatarSrc(m.user?.avatar_url)}>{initialOf(m.user?.username)}</Avatar>
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <span className="truncate">{m.user?.username}</span>
                        {m.role === "owner" && <Crown className="size-3.5 text-brand-600" />}
                        {isSelf && <span className="text-xs text-fg-muted">{t("group.you")}</span>}
                      </div>
                      <div className="truncate text-xs text-fg-muted">{m.user?.email}</div>
                    </div>
                    <Chip
                      size="small"
                      color={ROLE_COLOR[m.role]}
                      variant={m.role === "member" ? "outlined" : "filled"}
                      label={t(`group.roles.${m.role}`)}
                      onClick={canChangeRole ? (e) => setRoleMenu({ anchor: e.currentTarget, member: m }) : undefined}
                      onDelete={canChangeRole ? (e) => setRoleMenu({ anchor: e.currentTarget, member: m }) : undefined}
                      deleteIcon={canChangeRole ? <ChevronDown className="size-3.5" /> : undefined}
                    />
                    {canManage ? (
                      <Tooltip title={t("group.remove")}>
                        <IconButton size="small" color="error" onClick={() => remove(m)}>
                          <Trash2 className="size-4" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <span className="w-8" />
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </DialogContent>
      {adding && (
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="inherit" onClick={() => setAdding(false)}>
            {t("common:actions.cancel")}
          </Button>
          <Button variant="contained" loading={busy} disabled={!toAdd.length} onClick={addSelected}>
            {t("common:actions.add")}
          </Button>
        </DialogActions>
      )}

      <Menu anchorEl={roleMenu?.anchor} open={Boolean(roleMenu)} onClose={() => setRoleMenu(null)}>
        {["member", "admin"].map((role) => (
          <MenuItem
            key={role}
            selected={roleMenu?.member.role === role}
            onClick={() => changeRole(roleMenu.member, role)}
          >
            {t(`group.roles.${role}`)}
          </MenuItem>
        ))}
      </Menu>
    </Dialog>
  );
}
