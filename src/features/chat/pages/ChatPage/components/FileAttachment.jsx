/**
 * Вложение в сообщении (картинка, видео, файл). Используется в MessageItem.
 */
import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import CircularProgress from "@mui/material/CircularProgress";
import { authorizedFetch } from "@/shared/api/baseApi";

/**
 * Вложение сообщения. Файлы чата отдаются только с заголовком Login,
 * поэтому скачиваем их через fetch в Blob и показываем по blob:-ссылке.
 */
export function FileAttachment({ file, onPreview }) {
  const { t } = useTranslation("chat");
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl;
    let cancelled = false;
    authorizedFetch("chat", `/files/${file.id}/download`)
      .then((response) => response.blob())
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.id]);

  if (failed) return <span className="text-xs text-red-500">{t("fileFailed")}</span>;
  if (!url) return <CircularProgress size={18} />;

  if (file.mime_type?.startsWith("image/")) {
    return (
      <button type="button" onClick={() => onPreview?.({ url, type: "image" })}>
        <img src={url} alt={file.filename} className="max-h-56 max-w-full rounded-lg object-cover" />
      </button>
    );
  }
  if (file.mime_type?.startsWith("video/")) {
    return <video src={url} controls preload="metadata" className="max-h-64 max-w-full rounded-lg" />;
  }
  return (
    <a
      href={url}
      download={file.filename}
      className="flex items-center gap-2 text-sm font-medium text-brand-600 underline"
    >
      <FileText className="size-4" />
      {file.filename}
    </a>
  );
}
