import { useState } from "react";
import { Download, File, FileSpreadsheet, FileText, Image, PlayCircle, Presentation } from "lucide-react";
import { useTranslation } from "react-i18next";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { cn } from "@/shared/lib/cn";
import { downloadFile, fileName, fileType } from "@/shared/lib/files";

const ICONS = {
  image: [Image, "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"],
  video: [PlayCircle, "text-white bg-ink-900"],
  pdf: [FileText, "text-red-600 bg-red-50 dark:bg-red-900/20"],
  word: [FileText, "text-blue-700 bg-blue-50 dark:bg-blue-900/20"],
  excel: [FileSpreadsheet, "text-green-700 bg-green-50 dark:bg-green-900/20"],
  powerpoint: [Presentation, "text-orange-600 bg-orange-50 dark:bg-orange-900/20"],
  other: [File, "text-amber-600 bg-amber-50 dark:bg-amber-900/20"],
};

/**
 * Карточка вложения: превью для картинок, иконка для остального.
 * Картинку и видео открывает onPreview({ url, type }), остальное — скачивает.
 */
export function FileTile({ url, name, onPreview, className }) {
  const { t } = useTranslation();
  const [broken, setBroken] = useState(false);
  const type = fileType(name ?? url);
  const title = name ?? fileName(url);
  const [Icon, tone] = ICONS[type];
  const previewable = type === "image" || type === "video";

  const open = () => (previewable && onPreview ? onPreview({ url, type }) : downloadFile(url, title));

  return (
    <div
      className={cn(
        "group w-48 overflow-hidden rounded-2xl border border-line bg-card transition hover:shadow-md",
        className,
      )}
    >
      <button type="button" onClick={open} className="block w-full">
        {type === "image" && !broken ? (
          <img src={url} alt={title} onError={() => setBroken(true)} className="h-32 w-full object-cover" />
        ) : (
          <span className={cn("grid h-32 place-items-center", tone)}>
            <Icon className="size-10" />
          </span>
        )}
      </button>
      <div className="flex items-center gap-1 px-3 py-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium" title={title}>
          {title}
        </span>
        <Tooltip title={t("actions.download")}>
          <IconButton size="small" onClick={() => downloadFile(url, title)}>
            <Download className="size-4" />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
}
