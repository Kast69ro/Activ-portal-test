import { authorizedFetch } from "@/shared/api/baseApi";
import { downloadFile } from "@/shared/lib/files";

/** Скачать файл чата по нажатию «Скачать» в меню сообщения */
export async function downloadChatFile(file) {
  const response = await authorizedFetch("chat", `/files/${file.id}/download`);
  downloadFile(await response.blob(), file.filename);
}
