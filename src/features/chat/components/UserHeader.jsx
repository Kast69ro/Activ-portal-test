import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import { selectLogin } from "@/shared/model/auth";
import { useToast } from "@/shared/ui";
import { useUploadAvatarMutation } from "../chatApi";
import { selectOnlineUserIds } from "../chatSlice";
import { avatarSrc, initialOf } from "../utils";

const MAX_SIZE_MB = 5;

/** Текущий пользователь чата: аватар (с загрузкой нового) и статус «в сети» */
export function UserHeader({ me }) {
  const { t } = useTranslation("chat");
  const toast = useToast();
  const login = useSelector(selectLogin);
  const online = useSelector(selectOnlineUserIds);
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [upload, { isLoading }] = useUploadAvatarMutation();

  const name = me?.username ?? login;
  const isOnline = me ? online.includes(me.id) : false;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error(t("avatar.notImage"));
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return toast.error(t("avatar.tooBig", { mb: MAX_SIZE_MB }));
    try {
      await upload(file).unwrap();
      setPreview(URL.createObjectURL(file));
      toast.success(t("avatar.updated"));
    } catch {
      toast.error(t("avatar.failed"));
    }
  };

  return (
    <div className="flex items-center gap-2.5">
      <div className="text-right leading-tight">
        <div className="text-sm font-semibold">{name}</div>
        <div className="flex items-center justify-end gap-1 text-xs text-fg-muted">
          <span className={`size-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-ink-300"}`} />
          {t(isOnline ? "online" : "offline")}
        </div>
      </div>
      <div className="relative">
        <Avatar src={preview ?? avatarSrc(me?.avatar_url)} sx={{ width: 42, height: 42 }}>
          {initialOf(name)}
        </Avatar>
        {isLoading && (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-white/70">
            <CircularProgress size={18} />
          </span>
        )}
        <Tooltip title={t("avatar.change")}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
            className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full border-2 border-card bg-brand-600 text-white"
          >
            <Camera className="size-2.5" />
          </button>
        </Tooltip>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
      </div>
    </div>
  );
}
