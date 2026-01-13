import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { wsMessageSendSchema, wsSyncRequestSchema } from '../schemas/index.js';

interface AuthenticatedSocket extends Socket {
  userId: string;
  userEmail: string;
  userName: string;
}

interface JWTPayload {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

// Store online users: userId -> Set of socket IDs
const onlineUsers = new Map<string, Set<string>>();

export function setupSocketIO(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
      (socket as AuthenticatedSocket).userId = payload.id;
      (socket as AuthenticatedSocket).userEmail = payload.email;
      (socket as AuthenticatedSocket).userName = payload.name;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const userId = authSocket.userId;

    console.log(`User connected: ${authSocket.userName} (${userId})`);

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Join user to their conversation rooms
    await joinUserConversations(authSocket);

    // Handle message send
    socket.on('message:send', async (data, ack) => {
      try {
        const parseResult = wsMessageSendSchema.safeParse(data);
        if (!parseResult.success) {
          socket.emit('error', { message: 'Invalid message format', details: parseResult.error.errors });
          return;
        }

        const { conversationId, clientMsgId, body } = parseResult.data;

        // Verify user is member of conversation
        const membership = await prisma.conversationMember.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
        });

        if (!membership) {
          socket.emit('error', { message: 'Not a member of this conversation' });
          return;
        }

        // Check for duplicate (idempotency)
        const existingMessage = await prisma.message.findUnique({
          where: {
            senderId_clientMsgId: {
              senderId: userId,
              clientMsgId,
            },
          },
        });

        if (existingMessage) {
          // Return existing message (idempotent response)
          const ackPayload = {
            clientMsgId,
            messageId: existingMessage.id,
            createdAt: existingMessage.createdAt.toISOString(),
          };
          if (typeof ack === 'function') {
            ack(ackPayload);
          } else {
            socket.emit('message:ack', ackPayload);
          }
          return;
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
            clientMsgId,
            body,
          },
          include: {
            sender: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        // Acknowledge to sender
        const ackPayload = {
          clientMsgId,
          messageId: message.id,
          createdAt: message.createdAt.toISOString(),
        };
        
        if (typeof ack === 'function') {
          ack(ackPayload);
        } else {
          socket.emit('message:ack', ackPayload);
        }

        // Broadcast to all members in the conversation room (including sender for multi-device)
        io.to(`conversation:${conversationId}`).emit('message:new', {
          messageId: message.id,
          conversationId,
          senderId: message.senderId,
          senderName: message.sender.name,
          senderAvatar: message.sender.avatarUrl,
          clientMsgId,
          body: message.body,
          createdAt: message.createdAt.toISOString(),
        });

      } catch (error) {
        console.error('Error handling message:send:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle sync request (offline catch-up)
    socket.on('sync:request', async (data) => {
      try {
        const parseResult = wsSyncRequestSchema.safeParse(data);
        if (!parseResult.success) {
          socket.emit('error', { message: 'Invalid sync request', details: parseResult.error.errors });
          return;
        }

        const { conversationId, afterMessageId } = parseResult.data;

        // Verify user is member of conversation
        const membership = await prisma.conversationMember.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
        });

        if (!membership) {
          socket.emit('error', { message: 'Not a member of this conversation' });
          return;
        }

        // Build query
        const whereClause: { conversationId: string; createdAt?: { gt: Date } } = {
          conversationId,
        };

        if (afterMessageId) {
          const afterMessage = await prisma.message.findUnique({
            where: { id: afterMessageId },
            select: { createdAt: true },
          });

          if (afterMessage) {
            whereClause.createdAt = { gt: afterMessage.createdAt };
          }
        }

        const messages = await prisma.message.findMany({
          where: whereClause,
          include: {
            sender: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 100, // Limit sync batch
        });

        socket.emit('sync:batch', {
          conversationId,
          messages: messages.map((m) => ({
            messageId: m.id,
            conversationId: m.conversationId,
            senderId: m.senderId,
            senderName: m.sender.name,
            senderAvatar: m.sender.avatarUrl,
            clientMsgId: m.clientMsgId,
            body: m.body,
            createdAt: m.createdAt.toISOString(),
          })),
        });

        // Update last seen
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          await prisma.conversationMember.update({
            where: {
              conversationId_userId: {
                conversationId,
                userId,
              },
            },
            data: {
              lastSeenMsgId: lastMessage.id,
              lastSeenAt: new Date(),
            },
          });
        }

      } catch (error) {
        console.error('Error handling sync:request:', error);
        socket.emit('error', { message: 'Failed to sync messages' });
      }
    });

    // Handle typing indicator
    socket.on('typing:start', async (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:start', {
        conversationId: data.conversationId,
        userId,
        userName: authSocket.userName,
      });
    });

    socket.on('typing:stop', async (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:stop', {
        conversationId: data.conversationId,
        userId,
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${authSocket.userName} (${userId})`);
      
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
        }
      }
    });
  });

  return io;
}

async function joinUserConversations(socket: AuthenticatedSocket) {
  const memberships = await prisma.conversationMember.findMany({
    where: { userId: socket.userId },
    select: { conversationId: true },
  });

  for (const membership of memberships) {
    socket.join(`conversation:${membership.conversationId}`);
  }

  console.log(`User ${socket.userName} joined ${memberships.length} conversation rooms`);
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId) && onlineUsers.get(userId)!.size > 0;
}

export function getOnlineUsers(): string[] {
  return Array.from(onlineUsers.keys());
}
