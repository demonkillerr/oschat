import { z } from 'zod';

// User schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  googleSub: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().url().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

// Conversation schemas
export const conversationTypeSchema = z.enum(['dm', 'group']);
export type ConversationType = z.infer<typeof conversationTypeSchema>;

export const conversationSchema = z.object({
  id: z.string().uuid(),
  type: conversationTypeSchema,
  title: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Conversation = z.infer<typeof conversationSchema>;

// Member schemas
export const memberRoleSchema = z.enum(['owner', 'admin', 'member']);
export type MemberRole = z.infer<typeof memberRoleSchema>;

export const conversationMemberSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  userId: z.string().uuid(),
  role: memberRoleSchema,
  joinedAt: z.date(),
  lastSeenAt: z.date().nullable(),
  lastSeenMsgId: z.string().uuid().nullable(),
});

export type ConversationMember = z.infer<typeof conversationMemberSchema>;

// Message schemas
export const messageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  clientMsgId: z.string().uuid(),
  body: z.string(),
  createdAt: z.date(),
});

export type Message = z.infer<typeof messageSchema>;

// API Request/Response schemas
export const createDmRequestSchema = z.object({
  email: z.string().email(),
});

export const createGroupRequestSchema = z.object({
  title: z.string().min(1).max(100),
  memberEmails: z.array(z.string().email()).min(1),
});

export const addMemberRequestSchema = z.object({
  email: z.string().email(),
});

export const messagesQuerySchema = z.object({
  after: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// WebSocket event schemas
export const wsMessageSendSchema = z.object({
  conversationId: z.string().uuid(),
  clientMsgId: z.string().uuid(),
  body: z.string().min(1).max(10000),
});

export const wsSyncRequestSchema = z.object({
  conversationId: z.string().uuid(),
  afterMessageId: z.string().uuid().optional(),
});

export const wsAuthSchema = z.object({
  token: z.string(),
});
