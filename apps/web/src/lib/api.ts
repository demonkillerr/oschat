const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  auth: {
    getMe: () => fetchApi("/auth/me"),
    logout: () => fetchApi("/auth/logout", { method: "POST" }),
  },
  
  conversations: {
    getAll: () => fetchApi("/conversations"),
    getById: (id: string) => fetchApi(`/conversations/${id}`),
    create: (data: { type: "direct" | "group"; memberIds: string[]; name?: string }) =>
      fetchApi("/conversations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    addMembers: (id: string, memberIds: string[]) =>
      fetchApi(`/conversations/${id}/members`, {
        method: "POST",
        body: JSON.stringify({ memberIds }),
      }),
    searchUsers: (query: string) => fetchApi(`/conversations/users/search?q=${query}`),
  },
  
  messages: {
    getByConversation: (conversationId: string, limit = 50, before?: string) => {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (before) params.append("before", before);
      return fetchApi(`/messages/${conversationId}?${params}`);
    },
    markAsRead: (conversationId: string, messageIds: string[]) =>
      fetchApi(`/messages/${conversationId}/read`, {
        method: "POST",
        body: JSON.stringify({ messageIds }),
      }),
  },
};
