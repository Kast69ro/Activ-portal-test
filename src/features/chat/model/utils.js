/**
 * Вспомогательные функции чата: аватары, собеседник, превью сообщения, группировка по дням.
 */
import { fileUrl } from "@/shared/lib/files";

/** Быстрые реакции на сообщение */
export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

/** Аватар с сервера чата */
export const avatarSrc = (url) => (url ? fileUrl(url, "chat") : undefined);

/** Собеседник в личном чате */
export function getPeer(chat, login) {
  if (chat?.type !== "direct") return null;
  return chat.members?.find((m) => m.user?.username !== login)?.user ?? null;
}

/** Текст последнего сообщения для списка чатов */
export function messagePreview(message, t) {
  if (!message) return t("noMessages");
  if (message.is_deleted) return t("deleted");
  return message.content || t("attachment");
}

/** Сообщения, сгруппированные по дням: [{ day, items }] */
export function groupByDay(messages) {
  const groups = [];
  let last = null;
  for (const msg of messages) {
    const day = new Date(msg.created_at).toDateString();
    if (day !== last) {
      groups.push({ day: msg.created_at, items: [] });
      last = day;
    }
    groups[groups.length - 1].items.push(msg);
  }
  return groups;
}

export const initialOf = (name) => (name?.trim()?.[0] ?? "?").toUpperCase();
