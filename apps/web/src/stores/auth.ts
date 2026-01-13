import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { socketClient } from '@/lib/socket';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,

      setToken: (token) => {
        set({ token, isAuthenticated: !!token });
        api.setToken(token);
        socketClient.setToken(token);
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      fetchUser: async () => {
        const { token } = get();
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        try {
          api.setToken(token);
          const user = await api.get<User>('/me');
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch user:', error);
          set({ token: null, user: null, isAuthenticated: false, isLoading: false });
          api.setToken(null);
          socketClient.setToken(null);
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // Ignore logout errors
        }
        set({ token: null, user: null, isAuthenticated: false });
        api.setToken(null);
        socketClient.disconnect();
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.setToken(state.token);
          socketClient.setToken(state.token);
        }
      },
    }
  )
);
