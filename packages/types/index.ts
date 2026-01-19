export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  readReceipts?: ReadReceipt[];
}

export interface Conversation {
  id: string;
  type: "direct" | "group";
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  members: ConversationMember[];
  messages?: Message[];
}

export interface ConversationMember {
  id: string;
  userId: string;
  conversationId: string;
  joinedAt: Date;
  user: {
    id: string;
    name: string;
    avatar?: string;
    email: string;
  };
}

export interface ReadReceipt {
  id: string;
  messageId: string;
  userId: string;
  readAt: Date;
  user?: {
    id: string;
    name: string;
  };
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
}

export interface OnlineStatus {
  userId: string;
  online: boolean;
}
