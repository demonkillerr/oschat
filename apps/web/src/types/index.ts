// Shared types between frontend and backend
// Can be extracted to a shared package later

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt?: string;
}

export interface Conversation {
  id: string;
  type: 'dm' | 'group';
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  lastSeenAt: string | null;
  lastSeenMsgId: string | null;
  user: Pick<User, 'id' | 'email' | 'name' | 'avatarUrl'>;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  clientMsgId: string;
  body: string;
  createdAt: string;
}

// WebSocket payloads
export interface MessageSendPayload {
  conversationId: string;
  clientMsgId: string;
  body: string;
}

export interface MessageAckPayload {
  clientMsgId: string;
  messageId: string;
  createdAt: string;
}

export interface MessageNewPayload {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  clientMsgId: string;
  body: string;
  createdAt: string;
}

export interface SyncRequestPayload {
  conversationId: string;
  afterMessageId?: string;
}

export interface SyncBatchPayload {
  conversationId: string;
  messages: MessageNewPayload[];
}
