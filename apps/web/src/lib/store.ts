import { create } from "zustand";
import type { User, Conversation, Message } from "@chat/types";

interface ChatState {
  user: User | null;
  conversations: Conversation[];
  selectedConversationId: string | null;
  messages: Record<string, Message[]>;
  onlineUsers: Set<string>;
  typingUsers: Record<string, Set<string>>;
  unreadCounts: Record<string, number>;
  
  setUser: (user: User | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  setSelectedConversationId: (id: string | null) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversationLastMessage: (message: Message) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  addTypingUser: (conversationId: string, userId: string) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  user: null,
  conversations: [],
  selectedConversationId: null,
  messages: {},
  onlineUsers: new Set(),
  typingUsers: {},
  unreadCounts: {},

  setUser: (user) => set({ user }),
  
  setConversations: (conversations) => set({ conversations }),
  
  setSelectedConversationId: (id) => set({ selectedConversationId: id }),
  
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  updateConversationLastMessage: (message) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === message.conversationId
          ? { ...conv, messages: [message] }
          : conv
      ),
    })),
  
  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    })),
  
  addMessage: (message) =>
    set((state) => {
      const conversationMessages = state.messages[message.conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [message.conversationId]: [...conversationMessages, message],
        },
      };
    }),

  incrementUnread: (conversationId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: (state.unreadCounts[conversationId] || 0) + 1,
      },
    })),

  clearUnread: (conversationId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: 0,
      },
    })),
  
  setUserOnline: (userId) =>
    set((state) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      newOnlineUsers.add(userId);
      return { onlineUsers: newOnlineUsers };
    }),
  
  setUserOffline: (userId) =>
    set((state) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      newOnlineUsers.delete(userId);
      return { onlineUsers: newOnlineUsers };
    }),
  
  addTypingUser: (conversationId, userId) =>
    set((state) => {
      const conversationTyping = new Set(state.typingUsers[conversationId] || []);
      conversationTyping.add(userId);
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: conversationTyping,
        },
      };
    }),
  
  removeTypingUser: (conversationId, userId) =>
    set((state) => {
      const conversationTyping = new Set(state.typingUsers[conversationId] || []);
      conversationTyping.delete(userId);
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: conversationTyping,
        },
      };
    }),
}));
