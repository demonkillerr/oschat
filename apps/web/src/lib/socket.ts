import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

export interface MessagePayload {
  conversationId: string;
  clientMsgId: string;
  body: string;
}

export interface MessageAck {
  clientMsgId: string;
  messageId: string;
  createdAt: string;
}

export interface NewMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  clientMsgId: string;
  body: string;
  createdAt: string;
}

export interface SyncBatch {
  conversationId: string;
  messages: NewMessage[];
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  userName?: string;
}

export type SocketEvents = {
  'message:send': (data: MessagePayload, ack?: (response: MessageAck) => void) => void;
  'message:ack': (data: MessageAck) => void;
  'message:new': (data: NewMessage) => void;
  'sync:request': (data: { conversationId: string; afterMessageId?: string }) => void;
  'sync:batch': (data: SyncBatch) => void;
  'typing:start': (data: { conversationId: string }) => void;
  'typing:stop': (data: { conversationId: string }) => void;
  'error': (data: { message: string }) => void;
};

class SocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;
  private connectionPromise: Promise<void> | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (!token && this.socket) {
      this.disconnect();
    }
  }

  connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.socket?.connected) {
      return Promise.resolve();
    }

    if (!this.token) {
      return Promise.reject(new Error('No token available'));
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      this.socket = io(WS_URL, {
        auth: { token: this.token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.connectionPromise = null;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.connectionPromise = null;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });
    });

    return this.connectionPromise;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionPromise = null;
    }
  }

  on<K extends keyof SocketEvents>(
    event: K,
    callback: Parameters<SocketEvents[K]>[0] extends (data: infer T) => void
      ? (data: T) => void
      : never
  ) {
    this.socket?.on(event, callback as never);
  }

  off<K extends keyof SocketEvents>(event: K, callback?: (...args: unknown[]) => void) {
    if (callback) {
      this.socket?.off(event, callback as never);
    } else {
      this.socket?.off(event);
    }
  }

  emit<K extends keyof SocketEvents>(
    event: K,
    ...args: Parameters<SocketEvents[K]>
  ) {
    this.socket?.emit(event, ...args);
  }

  sendMessage(data: MessagePayload): Promise<MessageAck> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Message send timeout'));
      }, 10000);

      this.socket.emit('message:send', data, (ack: MessageAck) => {
        clearTimeout(timeout);
        resolve(ack);
      });
    });
  }

  requestSync(conversationId: string, afterMessageId?: string) {
    this.socket?.emit('sync:request', { conversationId, afterMessageId });
  }

  startTyping(conversationId: string) {
    this.socket?.emit('typing:start', { conversationId });
  }

  stopTyping(conversationId: string) {
    this.socket?.emit('typing:stop', { conversationId });
  }

  get connected() {
    return this.socket?.connected ?? false;
  }

  get id() {
    return this.socket?.id;
  }
}

export const socketClient = new SocketClient();
