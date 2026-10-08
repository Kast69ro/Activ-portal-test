/**
 * Полноэкранный просмотр картинки или видео. Используют chat и knowledge.
 */
import { X } from "lucide-react";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import { useRetained } from "@/shared/lib/useRetained";

/** Просмотр картинки или видео поверх страницы. file = { url, type: "image" | "video" } | null */
export function FilePreviewDialog({ file: current, onClose }) {
  // Пока окно закрывается, показываем последний файл — иначе содержимое пропадёт до конца анимации
  const file = useRetained(current);
  return (
    <Dialog
      open={Boolean(current)}
      onClose={onClose}
      maxWidth="lg"
      slotProps={{ paper: { sx: { bgcolor: "#000", overflow: "hidden" } } }}
    >
      <IconButton
        onClick={onClose}
        sx={{ position: "absolute", top: 8, right: 8, zIndex: 1, color: "#fff", bgcolor: "rgb(0 0 0 / 0.4)" }}
      >
        <X className="size-5" />
      </IconButton>
      {file?.type === "video" ? (
        <video src={file.url} controls autoPlay className="block max-h-[85vh] w-full" />
      ) : (
        file && <img src={file.url} alt="" className="block max-h-[85vh] w-full object-contain" />
      )}
    </Dialog>
  );
}
