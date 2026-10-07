import { lazy } from "react";
import { MessagesSquare } from "lucide-react";

/**
 * Чат сотрудников (отдельный сервис, REST + WebSocket).
 * В прежней системе пункт меню видели только пользователи с ролью Basic,
 * хотя страница была доступна всем; здесь чат в меню у всех.
 */
export default {
  id: "chat",
  path: "/chat",
  icon: MessagesSquare,
  section: "communication",
  order: 10,
  titleKey: "menu",
  page: lazy(() => import("./pages/ChatPage/ChatPage")),
};
