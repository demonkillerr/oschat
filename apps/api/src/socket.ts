import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface TypingData {
  conversationId: string;
  userName: string;
}

interface SendMessageData {
  conversationId: string;
  content: string;
}

export function setupSocketIO(io: Server, prisma: PrismaClient) {
  // Middleware to authenticate socket connections
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      // In production, verify JWT token here
      // For now, we'll extract userId from token (simplified)
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
      );
      socket.userId = payload.userId;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    if (!socket.userId) {
      socket.disconnect();
      return;
    }

    // Join user's personal room (for direct notifications)
    socket.join(`user:${socket.userId}`);

    // Get user's conversations and join their rooms
    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId: socket.userId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    conversations.forEach((conv) => {
      socket.join(`conversation:${conv.id}`);
    });

    // Emit online status
    socket.broadcast.emit("user:online", { userId: socket.userId });

    // Join conversation room
    socket.on("join:conversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on("leave:conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Send message
    socket.on("message:send", async (data: SendMessageData) => {
      try {
        const { conversationId, content } = data;

        // Verify user is member of conversation
        const membership = await prisma.conversationMember.findFirst({
          where: {
            conversationId,
            userId: socket.userId,
          },
        });

        if (!membership) {
          socket.emit("error", { message: "Not a member of this conversation" });
          return;
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            content,
            senderId: socket.userId!,
            conversationId,
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            readReceipts: true,
          },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        // Emit to all users in conversation
        io.to(`conversation:${conversationId}`).emit("message:new", message);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Typing indicator
    socket.on("typing:start", async (data: TypingData) => {
      const { conversationId, userName } = data;
      socket.to(`conversation:${conversationId}`).emit("typing:start", {
        conversationId,
        userId: socket.userId,
        userName,
      });
    });

    socket.on("typing:stop", (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit("typing:stop", {
        conversationId,
        userId: socket.userId,
      });
    });

    // Message read
    socket.on("message:read", async (data: { messageId: string; conversationId: string }) => {
      try {
        const { messageId, conversationId } = data;

        // Create read receipt
        await prisma.readReceipt.create({
          data: {
            messageId,
            userId: socket.userId!,
          },
        });

        // Emit to conversation
        io.to(`conversation:${conversationId}`).emit("message:read", {
          messageId,
          userId: socket.userId,
        });
      } catch (error) {
        // Ignore duplicate read receipts
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
      socket.broadcast.emit("user:offline", { userId: socket.userId });
    });
  });
}
