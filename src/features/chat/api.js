/**
 * API чата (service: "chat"). Теги: Chats, Messages, ChatMembers, ChatMe.
 * Используется только доменом chat.
 */
import { baseApi } from "@/shared/api/baseApi";

/**
 * REST чата (сервис chat, авторизация заголовком Login).
 * Новые сообщения, правки и реакции приходят по WebSocket — см. useChatSocket.js:
 * он обновляет кэш этих запросов через chatApi.util.updateQueryData.
 */
const unwrap = (res) => res?.data ?? res;
const asList = (res) => {
  const raw = unwrap(res);
  return Array.isArray(raw) ? raw : [];
};
const chat = (url, extra = {}) => ({ url, service: "chat", ...extra });

export const chatApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["Chats", "Messages", "ChatMembers", "ChatMe"] })
  .injectEndpoints({
    endpoints: (build) => ({
      getMe: build.query({
        query: () => chat("/users/me"),
        transformResponse: unwrap,
        providesTags: ["ChatMe"],
      }),
      uploadAvatar: build.mutation({
        query: (file) => {
          const body = new FormData();
          body.append("file", file);
          return chat("/users/avatar", { method: "POST", body });
        },
        invalidatesTags: ["ChatMe"],
      }),
      searchUsers: build.query({
        query: (q) => chat("/users/search", { params: { query: q } }),
        transformResponse: asList,
      }),

      // ─── Чаты ───
      getChats: build.query({
        query: (type) => chat("/chats", { params: { type } }),
        transformResponse: (res) => asList(res).map((c) => ({ ...c, unread_count: c.unread_count ?? 0 })),
        providesTags: ["Chats"],
      }),
      getChat: build.query({
        query: (id) => chat(`/chats/${id}`),
        transformResponse: unwrap,
        providesTags: (_, __, id) => [{ type: "Chats", id }],
      }),
      createChat: build.mutation({
        query: (body) => chat("/chats", { method: "POST", body }),
        transformResponse: unwrap,
        invalidatesTags: ["Chats"],
      }),
      updateChat: build.mutation({
        query: ({ id, ...body }) => chat(`/chats/${id}`, { method: "PATCH", body }),
        invalidatesTags: ["Chats"],
      }),
      deleteChat: build.mutation({
        query: (id) => chat(`/chats/${id}`, { method: "DELETE" }),
        invalidatesTags: ["Chats"],
      }),
      markRead: build.mutation({
        query: ({ chatId, lastMessageId }) =>
          chat(`/chats/${chatId}/read`, { method: "POST", body: { last_read_message_id: lastMessageId } }),
        // Счётчик обнуляем сразу, не дожидаясь ответа
        onQueryStarted: ({ chatId }, { dispatch }) => {
          for (const type of ["direct", "group"]) {
            dispatch(
              chatApi.util.updateQueryData("getChats", type, (draft) => {
                const c = draft.find((x) => x.id === chatId);
                if (c) c.unread_count = 0;
              }),
            );
          }
        },
      }),

      // ─── Участники групп ───
      getMembers: build.query({
        query: (chatId) => chat(`/chats/${chatId}/members`),
        transformResponse: asList,
        providesTags: (_, __, chatId) => [{ type: "ChatMembers", id: chatId }],
      }),
      addMember: build.mutation({
        query: ({ chatId, userId }) => chat(`/chats/${chatId}/members`, { method: "POST", body: { user_id: userId } }),
        invalidatesTags: (_, __, { chatId }) => [{ type: "ChatMembers", id: chatId }],
      }),
      updateMemberRole: build.mutation({
        query: ({ chatId, userId, role }) =>
          chat(`/chats/${chatId}/members/${userId}`, { method: "POST", body: { role } }),
        invalidatesTags: (_, __, { chatId }) => [{ type: "ChatMembers", id: chatId }],
      }),
      removeMember: build.mutation({
        query: ({ chatId, userId }) => chat(`/chats/${chatId}/members/${userId}`, { method: "DELETE" }),
        invalidatesTags: (_, __, { chatId }) => [{ type: "ChatMembers", id: chatId }],
      }),

      // ─── Сообщения ───
      getMessages: build.query({
        query: (chatId) => chat("/messages", { params: { chat_id: chatId, limit: 50 } }),
        transformResponse: asList,
        providesTags: (_, __, chatId) => [{ type: "Messages", id: chatId }],
      }),
      /** Запасной путь отправки, когда WebSocket переподключается */
      sendMessage: build.mutation({
        query: ({ chatId, content }) => chat("/messages", { method: "POST", body: { chat_id: chatId, content } }),
        transformResponse: unwrap,
      }),
      sendFile: build.mutation({
        query: ({ chatId, file }) => {
          const body = new FormData();
          body.append("chat_id", chatId);
          body.append("file", file);
          return chat("/messages/file", { method: "POST", body });
        },
        transformResponse: unwrap,
      }),
      updateMessage: build.mutation({
        query: ({ id, content }) => chat(`/messages/${id}`, { method: "PUT", body: { content } }),
        transformResponse: unwrap,
      }),
      deleteMessage: build.mutation({
        query: (id) => chat(`/messages/${id}`, { method: "DELETE" }),
      }),
      addReaction: build.mutation({
        query: ({ messageId, reaction }) =>
          chat(`/messages/${messageId}/reactions`, { method: "POST", body: { reaction } }),
      }),
      removeReaction: build.mutation({
        query: ({ messageId, reaction }) =>
          chat(`/messages/${messageId}/reactions`, { method: "DELETE", body: { reaction } }),
      }),
    }),
  });

export const {
  useGetMeQuery,
  useUploadAvatarMutation,
  useSearchUsersQuery,
  useGetChatsQuery,
  useGetChatQuery,
  useCreateChatMutation,
  useUpdateChatMutation,
  useDeleteChatMutation,
  useMarkReadMutation,
  useGetMembersQuery,
  useAddMemberMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useSendFileMutation,
  useUpdateMessageMutation,
  useDeleteMessageMutation,
  useAddReactionMutation,
  useRemoveReactionMutation,
} = chatApi;

/** Изменить сообщение в кэше открытого чата */
export const patchMessages = (chatId, recipe) => chatApi.util.updateQueryData("getMessages", chatId, recipe);

/** Изменить список чатов (обе вкладки: личные и группы) */
export const patchChats = (recipe) => (dispatch) => {
  for (const type of ["direct", "group"]) dispatch(chatApi.util.updateQueryData("getChats", type, recipe));
};
