import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  getMe: () => api.get('/api/auth/me'),
  logout: () => api.post('/api/auth/logout'),
};

// Users API
export const usersApi = {
  search: (query: string) => api.get(`/api/users/search?q=${encodeURIComponent(query)}`),
  getById: (id: string) => api.get(`/api/users/${id}`),
  updateProfile: (data: { name?: string; avatar?: string }) => api.patch('/api/users/me', data),
};

// Conversations API
export const conversationsApi = {
  getAll: () => api.get('/api/conversations'),
  getById: (id: string) => api.get(`/api/conversations/${id}`),
  create: (data: { type: 'direct' | 'group'; participantIds: string[]; name?: string }) =>
    api.post('/api/conversations', data),
  getMessages: (id: string, params?: { limit?: number; before?: string }) =>
    api.get(`/api/conversations/${id}/messages`, { params }),
  update: (id: string, data: { name?: string; avatar?: string }) =>
    api.patch(`/api/conversations/${id}`, data),
  addParticipants: (id: string, userIds: string[]) =>
    api.post(`/api/conversations/${id}/participants`, { userIds }),
};

export default api;
