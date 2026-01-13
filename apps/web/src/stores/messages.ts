import { create } from 'zustand';
import { api } from '@/lib/api';
import { socketClient, NewMessage } from '@/lib/socket';
import { generateClientMsgId } from '@/lib/utils';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  clientMsgId: string;
  body: string;
  createdAt: string;
  status: 'sending' | 'sent' | 'failed';
}

interface MessagesState {
  messagesByConversation: Record<string, Message[]>;
  seenMessageIds: Set<string>;
  pendingMessages: Map<string, Message>;
  isLoading: boolean;
  error: string | null;
  fetchMessages: (conversationId: string, after?: string) => Promise<void>;
  sendMessage: (conversationId: string, body: string, userId: string, userName: string, userAvatar: string | null) => Promise<void>;
  addMessage: (message: NewMessage) => void;
  syncMessages: (conversationId: string, messages: NewMessage[]) => void;
  markMessageSent: (clientMsgId: string, messageId: string, createdAt: string) => void;
  markMessageFailed: (clientMsgId: string) => void;
  getLastMessageId: (conversationId: string) => string | undefined;
}

export const useMessageStore = create<MessagesState>((set, get) => ({
  messagesByConversation: {},
  seenMessageIds: new Set(),
  pendingMessages: new Map(),
  isLoading: false,
  error: null,

  fetchMessages: async (conversationId, after) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (after) params.set('after', after);
      params.set('limit', '50');

      const response = await api.get<Array<{
        id: string;
        conversationId: string;
        senderId: string;
        clientMsgId: string;
        body: string;
        createdAt: string;
        sender: { id: string; name: string; avatarUrl: string | null };
      }>>(`/conversations/${conversationId}/messages?${params}`);

      const messages: Message[] = response.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        senderName: m.sender.name,
        senderAvatar: m.sender.avatarUrl,
        clientMsgId: m.clientMsgId,
        body: m.body,
        createdAt: m.createdAt,
        status: 'sent' as const,
      }));

      set((state) => {
        const newSeenIds = new Set(state.seenMessageIds);
        messages.forEach((m) => newSeenIds.add(m.id));

        const existing = state.messagesByConversation[conversationId] || [];
        const existingIds = new Set(existing.map((m) => m.id));
        const newMessages = messages.filter((m) => !existingIds.has(m.id));

        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: [...existing, ...newMessages].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            ),
          },
          seenMessageIds: newSeenIds,
          isLoading: false,
        };
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  sendMessage: async (conversationId, body, userId, userName, userAvatar) => {
    const clientMsgId = generateClientMsgId();
    const tempMessage: Message = {
      id: `temp-${clientMsgId}`,
      conversationId,
      senderId: userId,
      senderName: userName,
      senderAvatar: userAvatar,
      clientMsgId,
      body,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    // Optimistic update
    set((state) => {
      const existing = state.messagesByConversation[conversationId] || [];
      const newPending = new Map(state.pendingMessages);
      newPending.set(clientMsgId, tempMessage);

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [...existing, tempMessage],
        },
        pendingMessages: newPending,
      };
    });

    try {
      const ack = await socketClient.sendMessage({
        conversationId,
        clientMsgId,
        body,
      });
      get().markMessageSent(clientMsgId, ack.messageId, ack.createdAt);
    } catch (error) {
      console.error('Failed to send message:', error);
      get().markMessageFailed(clientMsgId);
    }
  },

  addMessage: (message) => {
    const { seenMessageIds, pendingMessages } = get();

    // Client-side dedupe: skip if we've already seen this message
    if (seenMessageIds.has(message.messageId)) {
      return;
    }

    // Skip if this is our own message that's still pending (we'll update via ack)
    if (pendingMessages.has(message.clientMsgId)) {
      return;
    }

    set((state) => {
      const existing = state.messagesByConversation[message.conversationId] || [];
      const newSeenIds = new Set(state.seenMessageIds);
      newSeenIds.add(message.messageId);

      const newMessage: Message = {
        id: message.messageId,
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderName: message.senderName,
        senderAvatar: message.senderAvatar,
        clientMsgId: message.clientMsgId,
        body: message.body,
        createdAt: message.createdAt,
        status: 'sent',
      };

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [message.conversationId]: [...existing, newMessage].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ),
        },
        seenMessageIds: newSeenIds,
      };
    });
  },

  syncMessages: (conversationId, messages) => {
    set((state) => {
      const newSeenIds = new Set(state.seenMessageIds);
      const existing = state.messagesByConversation[conversationId] || [];
      const existingIds = new Set(existing.map((m) => m.id));

      const newMessages: Message[] = [];
      for (const m of messages) {
        // Client-side dedupe
        if (newSeenIds.has(m.messageId) || existingIds.has(m.messageId)) {
          continue;
        }
        newSeenIds.add(m.messageId);
        newMessages.push({
          id: m.messageId,
          conversationId: m.conversationId,
          senderId: m.senderId,
          senderName: m.senderName,
          senderAvatar: m.senderAvatar,
          clientMsgId: m.clientMsgId,
          body: m.body,
          createdAt: m.createdAt,
          status: 'sent',
        });
      }

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [...existing, ...newMessages].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ),
        },
        seenMessageIds: newSeenIds,
      };
    });
  },

  markMessageSent: (clientMsgId, messageId, createdAt) => {
    set((state) => {
      const newPending = new Map(state.pendingMessages);
      const pending = newPending.get(clientMsgId);
      newPending.delete(clientMsgId);

      if (!pending) return { pendingMessages: newPending };

      const newSeenIds = new Set(state.seenMessageIds);
      newSeenIds.add(messageId);

      const messages = state.messagesByConversation[pending.conversationId] || [];
      const updatedMessages = messages.map((m) =>
        m.clientMsgId === clientMsgId
          ? { ...m, id: messageId, createdAt, status: 'sent' as const }
          : m
      );

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [pending.conversationId]: updatedMessages,
        },
        pendingMessages: newPending,
        seenMessageIds: newSeenIds,
      };
    });
  },

  markMessageFailed: (clientMsgId) => {
    set((state) => {
      const newPending = new Map(state.pendingMessages);
      const pending = newPending.get(clientMsgId);
      newPending.delete(clientMsgId);

      if (!pending) return { pendingMessages: newPending };

      const messages = state.messagesByConversation[pending.conversationId] || [];
      const updatedMessages = messages.map((m) =>
        m.clientMsgId === clientMsgId ? { ...m, status: 'failed' as const } : m
      );

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [pending.conversationId]: updatedMessages,
        },
        pendingMessages: newPending,
      };
    });
  },

  getLastMessageId: (conversationId) => {
    const messages = get().messagesByConversation[conversationId];
    if (!messages || messages.length === 0) return undefined;
    const sentMessages = messages.filter((m) => m.status === 'sent' && !m.id.startsWith('temp-'));
    return sentMessages.length > 0 ? sentMessages[sentMessages.length - 1].id : undefined;
  },
}));
