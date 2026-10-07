/**
 * Низкоуровневое WebSocket-соединение чата. Используют useChatSocket и ChatThread (отправка сообщений и «печатает…»).
 */
import { CHAT_WS_URL } from "@/config/env";

/**
 * WebSocket чата с автоматическим переподключением (1 с → 2 с → … → 30 с).
 * Сервер шлёт строки JSON вида { type, payload }, иногда несколько через "\n".
 */
class ChatSocket {
  constructor(login, handlers) {
    this.url = `${CHAT_WS_URL}?login=${encodeURIComponent(login)}`;
    this.handlers = handlers;
    this.retry = 1000;
    this.closedByUser = false;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.retry = 1000;
      this.handlers.onReconnect?.();
    };

    this.ws.onmessage = (event) => {
      for (const line of String(event.data).split("\n")) {
        if (!line.trim()) continue;
        try {
          const { type, payload } = JSON.parse(line);
          this.handlers[type]?.(payload);
        } catch (error) {
          console.warn("Chat WS: не удалось разобрать сообщение", error);
        }
      }
    };

    this.ws.onclose = () => {
      if (this.closedByUser) return;
      this.timer = setTimeout(() => this.connect(), this.retry);
      this.retry = Math.min(this.retry * 2, 30_000);
    };
  }

  send(type, payload) {
    if (this.ws?.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify({ type, payload }));
    return true;
  }

  close() {
    this.closedByUser = true;
    clearTimeout(this.timer);
    this.ws?.close();
  }
}

let instance = null;

export function openChatSocket(login, handlers) {
  instance?.close();
  instance = new ChatSocket(login, handlers);
  return instance;
}

export function closeChatSocket(socket) {
  socket.close();
  if (instance === socket) instance = null;
}

/** Отправка через сокет. false — сокет сейчас закрыт (идёт переподключение) */
export const sendSocket = (type, payload) => (instance ? instance.send(type, payload) : false);
