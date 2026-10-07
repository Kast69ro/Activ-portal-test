/**
 * Хук WebSocket чата: применяет события сервера к кэшу RTK Query и chatSlice. Используется в ChatPage.
 */
import { useEffect } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { selectLogin } from "@/shared/model/auth";
import { useToast } from "@/shared/ui";
import { chatApi, patchChats, patchMessages } from "@/features/chat/api";
import { selectActiveChatId, setOnlineUsers, setTyping } from "./chatSlice";
import { closeChatSocket, openChatSocket } from "./socket";

/** «Печатает…» сбрасывается сам, если is_typing:false так и не пришло (закрыли вкладку) */
const TYPING_TIMEOUT = 6000;

/**
 * Подключает WebSocket чата, пока открыта страница чата.
 * События сервера применяются к кэшу RTK Query — компоненты просто перерисовываются.
 */
export function useChatSocket(me) {
  const dispatch = useDispatch();
  const store = useStore();
  const toast = useToast();
  const login = useSelector(selectLogin);
  const meId = me?.id;

  useEffect(() => {
    if (!login) return;
    const typingTimers = new Map();
    const activeChatId = () => selectActiveChatId(store.getState());

    const typing = (chatId, userId, isTyping) => {
      const key = `${chatId}:${userId}`;
      clearTimeout(typingTimers.get(key));
      typingTimers.delete(key);
      dispatch(setTyping({ chatId, userId, isTyping }));
      if (isTyping) {
        typingTimers.set(
          key,
          setTimeout(() => dispatch(setTyping({ chatId, userId, isTyping: false })), TYPING_TIMEOUT),
        );
      }
    };

    const isMine = (msg) => (meId != null ? msg.sender_id === meId : msg.sender?.username === login);

    const socket = openChatSocket(login, {
      // При каждом (пере)подключении: пока сокета не было, события терялись — перезапрашиваем
      onReconnect: () => {
        const id = activeChatId();
        dispatch(chatApi.util.invalidateTags(["Chats", ...(id ? [{ type: "Messages", id }] : [])]));
      },

      new_message: (msg) => {
        typing(msg.chat_id, msg.sender_id, false);
        dispatch(
          patchMessages(msg.chat_id, (draft) => {
            if (!draft.some((m) => m.id === msg.id)) draft.push(msg);
          }),
        );

        const open = activeChatId() === msg.chat_id && !document.hidden;
        let known = false;
        dispatch(
          patchChats((draft) => {
            const index = draft.findIndex((c) => c.id === msg.chat_id);
            if (index === -1) return;
            known = true;
            const [chat] = draft.splice(index, 1);
            chat.last_message = msg;
            chat.updated_at = msg.created_at;
            if (!isMine(msg) && !open) chat.unread_count = (chat.unread_count ?? 0) + 1;
            draft.unshift(chat); // поднимаем чат наверх
          }),
        );
        // Новый чат (или открыт в другой вкладке) — список нужно перезапросить
        if (!known) dispatch(chatApi.util.invalidateTags(["Chats"]));

        if (open && !isMine(msg)) {
          dispatch(chatApi.endpoints.markRead.initiate({ chatId: msg.chat_id, lastMessageId: msg.id }));
        }
      },

      message_updated: (msg) => {
        dispatch(
          patchMessages(msg.chat_id, (draft) => {
            const m = draft.find((x) => x.id === msg.id);
            if (m) Object.assign(m, msg);
          }),
        );
        dispatch(
          patchChats((draft) => {
            const c = draft.find((x) => x.id === msg.chat_id);
            if (c?.last_message?.id === msg.id) c.last_message = msg;
          }),
        );
      },

      message_deleted: ({ message_id, chat_id }) => {
        dispatch(patchMessages(chat_id ?? activeChatId(), (draft) => draft.filter((m) => m.id !== message_id)));
        dispatch(chatApi.util.invalidateTags(["Chats"]));
      },

      // У пользователя одна реакция на сообщение: прежнюю убираем всегда
      reaction_updated: ({ message_id, user_id, reaction, action, chat_id }) => {
        dispatch(
          patchMessages(chat_id ?? activeChatId(), (draft) => {
            const m = draft.find((x) => x.id === message_id);
            if (!m) return;
            m.reactions = (m.reactions ?? []).filter((r) => r.user_id !== user_id);
            if (action === "added")
              m.reactions.push({ id: `ws-${message_id}-${user_id}`, message_id, user_id, reaction });
          }),
        );
      },

      online_users: ({ users }) => dispatch(setOnlineUsers((users ?? []).map((u) => u.user_id))),
      user_typing: ({ chat_id, user_id, is_typing }) => typing(chat_id, user_id, is_typing),

      // Прочитали с другой вкладки или устройства
      read_receipt: ({ chat_id, user_id }) => {
        if (user_id !== meId) return;
        dispatch(
          patchChats((draft) => {
            const c = draft.find((x) => x.id === chat_id);
            if (c) c.unread_count = 0;
          }),
        );
      },

      error: (err) => toast.error(err?.message),
    });

    return () => {
      typingTimers.forEach(clearTimeout);
      closeChatSocket(socket);
    };
  }, [login, meId, dispatch, store, toast]);
}
