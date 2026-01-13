import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

export async function userRoutes(app: FastifyInstance) {
  // Get current user
  app.get('/me', {
    preHandler: authenticate,
  }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return user;
  });

  // Search users by email (for adding to conversations)
  app.get('/users/search', {
    preHandler: authenticate,
  }, async (request, reply) => {
    const { email } = request.query as { email?: string };

    if (!email || email.length < 3) {
      return reply.status(400).send({ error: 'Email query must be at least 3 characters' });
    }

    const users = await prisma.user.findMany({
      where: {
        email: { contains: email, mode: 'insensitive' },
        NOT: { id: request.user!.id },
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
      take: 10,
    });

    return users;
  });
}
