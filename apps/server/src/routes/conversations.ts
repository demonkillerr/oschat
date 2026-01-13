import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import {
  createDmRequestSchema,
  createGroupRequestSchema,
  addMemberRequestSchema,
  messagesQuerySchema,
} from '../schemas/index.js';

export async function conversationRoutes(app: FastifyInstance) {
  // List user's conversations
  app.get('/', {
    preHandler: authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: { userId: request.user.id },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            body: true,
            createdAt: true,
            sender: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Transform response for DMs to show other user's name
    const transformed = conversations.map((conv) => {
      if (conv.type === 'dm') {
        const otherMember = conv.members.find((m) => m.userId !== request.user!.id);
        return {
          ...conv,
          displayName: otherMember?.user.name || 'Unknown',
          displayAvatar: otherMember?.user.avatarUrl,
        };
      }
      return {
        ...conv,
        displayName: conv.title || 'Group',
        displayAvatar: null,
      };
    });

    return transformed;
  });

  // Create DM conversation
  app.post('/dm', {
    preHandler: authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const parseResult = createDmRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Invalid request', details: parseResult.error.errors });
    }

    const { email } = parseResult.data;

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });

    if (!targetUser) {
      return reply.status(404).send({ error: 'User not found' });
    }

    if (targetUser.id === request.user.id) {
      return reply.status(400).send({ error: 'Cannot create DM with yourself' });
    }

    // Check if DM already exists between these users
    const existingDm = await prisma.conversation.findFirst({
      where: {
        type: 'dm',
        AND: [
          { members: { some: { userId: request.user.id } } },
          { members: { some: { userId: targetUser.id } } },
        ],
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, email: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    if (existingDm) {
      return existingDm;
    }

    // Create new DM conversation
    const conversation = await prisma.conversation.create({
      data: {
        type: 'dm',
        members: {
          create: [
            { userId: request.user.id, role: 'member' },
            { userId: targetUser.id, role: 'member' },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, email: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    return conversation;
  });

  // Create group conversation
  app.post('/group', {
    preHandler: authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const parseResult = createGroupRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Invalid request', details: parseResult.error.errors });
    }

    const { title, memberEmails } = parseResult.data;

    // Find all target users
    const targetUsers = await prisma.user.findMany({
      where: { email: { in: memberEmails } },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });

    if (targetUsers.length !== memberEmails.length) {
      const foundEmails = targetUsers.map((u) => u.email);
      const notFound = memberEmails.filter((e) => !foundEmails.includes(e));
      return reply.status(404).send({ error: 'Some users not found', notFound });
    }

    // Create group conversation with owner and members
    const conversation = await prisma.conversation.create({
      data: {
        type: 'group',
        title,
        members: {
          create: [
            { userId: request.user.id, role: 'owner' },
            ...targetUsers.map((u) => ({ userId: u.id, role: 'member' as const })),
          ],
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, email: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    return conversation;
  });

  // Get single conversation
  app.get('/:id', {
    preHandler: authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        members: { some: { userId: request.user.id } },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, email: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!conversation) {
      return reply.status(404).send({ error: 'Conversation not found' });
    }

    return conversation;
  });

  // Add member to group
  app.post('/:id/members', {
    preHandler: authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };
    const parseResult = addMemberRequestSchema.safeParse(request.body);
    
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Invalid request', details: parseResult.error.errors });
    }

    const { email } = parseResult.data;

    // Check user is owner/admin of the group
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId: id,
        userId: request.user.id,
        role: { in: ['owner', 'admin'] },
      },
      include: { conversation: true },
    });

    if (!membership) {
      return reply.status(403).send({ error: 'Not authorized to add members' });
    }

    if (membership.conversation.type !== 'group') {
      return reply.status(400).send({ error: 'Cannot add members to DM' });
    }

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!targetUser) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Check if already a member
    const existingMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      return reply.status(400).send({ error: 'User is already a member' });
    }

    // Add member
    await prisma.conversationMember.create({
      data: {
        conversationId: id,
        userId: targetUser.id,
        role: 'member',
      },
    });

    // Return updated conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, email: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    return conversation;
  });

  // Remove member from group
  app.delete('/:id/members/:userId', {
    preHandler: authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const { id, userId } = request.params as { id: string; userId: string };

    // Check user is owner/admin or removing themselves
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId: id,
        userId: request.user.id,
      },
      include: { conversation: true },
    });

    if (!membership) {
      return reply.status(403).send({ error: 'Not a member of this conversation' });
    }

    if (membership.conversation.type !== 'group') {
      return reply.status(400).send({ error: 'Cannot remove members from DM' });
    }

    const isAdmin = membership.role === 'owner' || membership.role === 'admin';
    const isSelf = userId === request.user.id;

    if (!isAdmin && !isSelf) {
      return reply.status(403).send({ error: 'Not authorized to remove members' });
    }

    // Don't allow owner to be removed
    const targetMembership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId,
        },
      },
    });

    if (targetMembership?.role === 'owner') {
      return reply.status(400).send({ error: 'Cannot remove the owner' });
    }

    await prisma.conversationMember.delete({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId,
        },
      },
    });

    return { success: true };
  });

  // Get messages for conversation
  app.get('/:id/messages', {
    preHandler: authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };
    const parseResult = messagesQuerySchema.safeParse(request.query);
    
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Invalid query', details: parseResult.error.errors });
    }

    const { after, limit } = parseResult.data;

    // Check user is a member
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: request.user.id,
        },
      },
    });

    if (!membership) {
      return reply.status(403).send({ error: 'Not a member of this conversation' });
    }

    // Build query
    const whereClause: { conversationId: string; createdAt?: { gt: Date } } = {
      conversationId: id,
    };

    if (after) {
      const afterMessage = await prisma.message.findUnique({
        where: { id: after },
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
      take: limit,
    });

    // Update last seen
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      await prisma.conversationMember.update({
        where: {
          conversationId_userId: {
            conversationId: id,
            userId: request.user.id,
          },
        },
        data: {
          lastSeenMsgId: lastMessage.id,
          lastSeenAt: new Date(),
        },
      });
    }

    return messages;
  });
}
