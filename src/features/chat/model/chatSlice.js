import { createSlice } from "@reduxjs/toolkit";

const EMPTY = [];

/**
 * Состояние чата, которого нет на сервере: открытый чат, вкладка,
 * кто онлайн и кто сейчас печатает (приходит по WebSocket).
 */
const chatSlice = createSlice({
  name: "chat",
  initialState: {
    activeChatId: null,
    chatType: "direct", // direct | group
    onlineUserIds: [],
    typingByChat: {}, // { [chatId]: [userId, ...] }
  },
  reducers: {
    openChat: (state, { payload }) => {
      state.activeChatId = payload;
    },
    setChatType: (state, { payload }) => {
      state.chatType = payload;
    },
    setOnlineUsers: (state, { payload }) => {
      state.onlineUserIds = payload;
    },
    setTyping: (state, { payload: { chatId, userId, isTyping } }) => {
      const current = state.typingByChat[chatId] ?? [];
      state.typingByChat[chatId] = isTyping
        ? current.includes(userId)
          ? current
          : [...current, userId]
        : current.filter((id) => id !== userId);
    },
  },
  selectors: {
    selectActiveChatId: (state) => state.activeChatId,
    selectChatType: (state) => state.chatType,
    selectOnlineUserIds: (state) => state.onlineUserIds,
    selectTypingIds: (state, chatId) => state.typingByChat[chatId] ?? EMPTY,
  },
});

export const { openChat, setChatType, setOnlineUsers, setTyping } = chatSlice.actions;
export const { selectActiveChatId, selectChatType, selectOnlineUserIds, selectTypingIds } = chatSlice.selectors;

export default chatSlice;
