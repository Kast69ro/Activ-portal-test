import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

/** Заголовок страницы: название, подзаголовок, кнопка «назад» и действия справа */
export function PageHeader({ title, description, actions, onBack }) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {onBack && (
          <Tooltip title={t("actions.back")}>
            <IconButton onClick={onBack} sx={{ border: 1, borderColor: "divider" }}>
              <ArrowLeft className="size-5" />
            </IconButton>
          </Tooltip>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-[28px] font-extrabold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-fg-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
