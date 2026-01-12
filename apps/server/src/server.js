import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { socketEvents, createMessage } from '../../../packages/shared/src/index.js';
import { connectMongo } from './config/db.js';
import { Message } from './models/Message.js';
import { User } from './models/User.js';
import { Conversation } from './models/Conversation.js';
import { verifyToken } from './middleware/auth.js';

const port = process.env.PORT || 4000;
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.WEB_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      // Allow anonymous connections for backward compatibility
      socket.userId = null;
      socket.isAuthenticated = false;
      return next();
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Invalid token'));
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id;
    socket.user = user;
    socket.isAuthenticated = true;
    next();
  } catch (error) {
    console.error('[socket] Authentication error:', error);
    next(new Error('Authentication failed'));
  }
});

io.on('connection', async (socket) => {
  console.log(`[socket] connected id=${socket.id} userId=${socket.userId || 'anonymous'}`);
  
  // Update user status if authenticated
  if (socket.isAuthenticated) {
    await User.findByIdAndUpdate(socket.userId, {
      status: 'online',
      socketId: socket.id,
      lastSeen: new Date()
    });

    // Join user's conversation rooms
    const conversations = await Conversation.find({ participants: socket.userId });
    conversations.forEach(conv => {
      socket.join(`conversation:${conv._id}`);
    });

    // Broadcast user online status
    io.emit('user:status', {
      userId: socket.userId,
      status: 'online'
    });
  }

  socket.emit('hello', { message: 'Socket.io server ready' });

  // Legacy chat event for backward compatibility
  socket.on(socketEvents.ChatSend, (payload) => {
    const msg = createMessage({ user: payload?.user || 'anon', text: payload?.text || '' });
    io.emit(socketEvents.ChatNew, msg);
    Message.create(msg).catch(() => {});
  });

  // New message event with conversation support
  socket.on('message:send', async (payload) => {
    try {
      if (!socket.isAuthenticated) {
        return socket.emit('error', { message: 'Authentication required' });
      }

      const { conversationId, text, type = 'text', attachments = [] } = payload;

      // Verify user is part of conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.userId
      });

      if (!conversation) {
        return socket.emit('error', { message: 'Conversation not found' });
      }

      // Create message
      const message = await Message.create({
        conversation: conversationId,
        sender: socket.userId,
        text,
        type,
        attachments,
        readBy: [{ user: socket.userId }]
      });

      // Update conversation's last message
      conversation.lastMessage = message._id;
      conversation.lastMessageAt = message.createdAt;
      await conversation.save();

      // Populate message details
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name avatar');

      // Emit to all participants in the conversation
      io.to(`conversation:${conversationId}`).emit('message:new', {
        conversationId,
        message: populatedMessage
      });

    } catch (error) {
      console.error('[socket] Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing:start', ({ conversationId }) => {
    if (socket.isAuthenticated) {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        userId: socket.userId,
        user: { name: socket.user.name, avatar: socket.user.avatar }
      });
    }
  });

  socket.on('typing:stop', ({ conversationId }) => {
    if (socket.isAuthenticated) {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId: socket.userId
      });
    }
  });

  // Mark messages as read
  socket.on('messages:read', async ({ conversationId, messageIds }) => {
    try {
      if (!socket.isAuthenticated) return;

      await Message.updateMany(
        {
          _id: { $in: messageIds },
          conversation: conversationId,
          'readBy.user': { $ne: socket.userId }
        },
        {
          $push: {
            readBy: {
              user: socket.userId,
              readAt: new Date()
            }
          }
        }
      );

      // Notify other participants
      socket.to(`conversation:${conversationId}`).emit('messages:read', {
        conversationId,
        userId: socket.userId,
        messageIds
      });
    } catch (error) {
      console.error('[socket] Error marking messages as read:', error);
    }
  });

  // Join conversation room
  socket.on('conversation:join', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });

  // Leave conversation room
  socket.on('conversation:leave', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('disconnect', async (reason) => {
    console.log(`[socket] disconnected id=${socket.id} reason=${reason}`);
    
    // Update user status if authenticated
    if (socket.isAuthenticated) {
      await User.findByIdAndUpdate(socket.userId, {
        status: 'offline',
        socketId: null,
        lastSeen: new Date()
      });

      // Broadcast user offline status
      io.emit('user:status', {
        userId: socket.userId,
        status: 'offline',
        lastSeen: new Date()
      });
    }
  });
});

server.listen(port, async () => {
  console.log(`server listening on :${port}`);
  await connectMongo();
});

