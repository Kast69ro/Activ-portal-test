import { FILE_HOSTS } from "@/config/env";

/** Путь к файлу с сервера → полный URL. Абсолютные и blob:-ссылки возвращаются как есть. */
export function fileUrl(path, service = "main") {
  if (!path) return "";
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return `${FILE_HOSTS[service]}/${String(path).replace(/^\/+/, "")}`;
}

const TYPES = [
  ["image", /\.(jpe?g|png|gif|webp|bmp|svg|ico)$/i],
  ["video", /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)$/i],
  ["pdf", /\.pdf$/i],
  ["word", /\.docx?$/i],
  ["excel", /\.xlsx?$/i],
  ["powerpoint", /\.(pptx?|ppsx?)$/i],
];

/** Тип файла по расширению: image | video | pdf | word | excel | powerpoint | other */
export function fileType(nameOrPath) {
  const name = String(nameOrPath ?? "").split("?")[0];
  return TYPES.find(([, re]) => re.test(name))?.[0] ?? "other";
}

/** Имя файла из пути, без кодирования */
export function fileName(path) {
  const last =
    String(path ?? "")
      .split(/[\\/]/)
      .pop() || "file";
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

/** Скачивание по URL или Blob */
export function downloadFile(source, name) {
  const href = source instanceof Blob ? URL.createObjectURL(source) : source;
  const link = document.createElement("a");
  link.href = href;
  link.download = name || "download";
  document.body.appendChild(link);
  link.click();
  link.remove();
  if (source instanceof Blob) setTimeout(() => URL.revokeObjectURL(href), 1000);
}
