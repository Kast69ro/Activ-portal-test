/**
 * Страница чата: список чатов слева, переписка справа, WebSocket на время открытия.
 * Маршрут: /chat. Доступ: все вошедшие.
 */
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import Card from "@mui/material/Card";
import { selectLogin, selectUser } from "@/shared/model/auth";
import { useGetMeQuery, useUpdateMeMutation } from "@/features/chat/api";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatThread } from "./components/ChatThread";
import { useChatSocket } from "@/features/chat/model/useChatSocket";

export default function ChatPage() {
  const login = useSelector(selectLogin);
  const user = useSelector(selectUser);
  const { data: me } = useGetMeQuery(login, { skip: !login });
  const [updateMe] = useUpdateMeMutation();
  const synced = useRef(false);
  useChatSocket(me);

  // Имя и фамилию из учётной записи отправляем в чат, только если их там ещё нет
  useEffect(() => {
    if (!me || synced.current || (me.first_name && me.last_name)) return;
    const first_name = (user?.firstName ?? "").trim();
    const last_name = (user?.lastName ?? "").trim();
    if (!first_name && !last_name) return;
    synced.current = true;
    updateMe({ login, first_name, last_name });
  }, [me, user, login, updateMe]);

  return (
    <Card sx={{ display: "flex", height: "calc(100dvh - 64px - 64px)", minHeight: 560, overflow: "hidden" }}>
      <ChatSidebar me={me} />
      <ChatThread me={me} />
    </Card>
  );
}
