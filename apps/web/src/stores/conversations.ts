import { create } from 'zustand';
import { api } from '@/lib/api';

export interface ConversationMember {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface LastMessage {
  id: string;
  body: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
  };
}

export interface Conversation {
  id: string;
  type: 'dm' | 'group';
  title: string | null;
  createdAt: string;
  updatedAt: string;
  members: ConversationMember[];
  messages?: LastMessage[];
  displayName: string;
  displayAvatar: string | null;
}

interface ConversationState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchConversations: () => Promise<void>;
  setCurrentConversation: (id: string | null) => void;
  createDm: (email: string) => Promise<Conversation>;
  createGroup: (title: string, memberEmails: string[]) => Promise<Conversation>;
  addMember: (conversationId: string, email: string) => Promise<void>;
  removeMember: (conversationId: string, userId: string) => Promise<void>;
  updateConversationOrder: (conversationId: string) => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  error: null,

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const conversations = await api.get<Conversation[]>('/conversations');
      set({ conversations, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  setCurrentConversation: (id) => {
    set({ currentConversationId: id });
  },

  createDm: async (email) => {
    const conversation = await api.post<Conversation>('/conversations/dm', { email });
    set((state) => ({
      conversations: [conversation, ...state.conversations.filter((c) => c.id !== conversation.id)],
      currentConversationId: conversation.id,
    }));
    return conversation;
  },

  createGroup: async (title, memberEmails) => {
    const conversation = await api.post<Conversation>('/conversations/group', {
      title,
      memberEmails,
    });
    set((state) => ({
      conversations: [conversation, ...state.conversations],
      currentConversationId: conversation.id,
    }));
    return conversation;
  },

  addMember: async (conversationId, email) => {
    const conversation = await api.post<Conversation>(`/conversations/${conversationId}/members`, {
      email,
    });
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, members: conversation.members } : c
      ),
    }));
  },

  removeMember: async (conversationId, userId) => {
    await api.delete(`/conversations/${conversationId}/members/${userId}`);
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, members: c.members.filter((m) => m.userId !== userId) }
          : c
      ),
    }));
  },

  updateConversationOrder: (conversationId) => {
    set((state) => {
      const conv = state.conversations.find((c) => c.id === conversationId);
      if (!conv) return state;
      return {
        conversations: [
          { ...conv, updatedAt: new Date().toISOString() },
          ...state.conversations.filter((c) => c.id !== conversationId),
        ],
      };
    });
  },
}));

export function useCurrentConversation(): Conversation | undefined {
  const { conversations, currentConversationId } = useConversationStore();
  return conversations.find((c) => c.id === currentConversationId);
}
