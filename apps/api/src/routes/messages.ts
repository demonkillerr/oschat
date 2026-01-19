import { FastifyPluginAsync } from "fastify";

const messageRoutes: FastifyPluginAsync = async (fastify) => {
  // Get messages for a conversation
  fastify.get("/:conversationId", {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const decoded = await request.jwtVerify() as { userId: string };
    const { conversationId } = request.params as { conversationId: string };
    const { limit = "50", before } = request.query as { limit?: string; before?: string };

    // Check if user is member of conversation
    const membership = await fastify.prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId: decoded.userId,
      },
    });

    if (!membership) {
      return reply.code(403).send({ error: "Not a member of this conversation" });
    }

    const messages = await fastify.prisma.message.findMany({
      where: {
        conversationId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        readReceipts: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: parseInt(limit),
    });

    reply.send(messages.reverse());
  });

  // Mark messages as read
  fastify.post("/:conversationId/read", {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const decoded = await request.jwtVerify() as { userId: string };
    const { conversationId } = request.params as { conversationId: string };
    const { messageIds } = request.body as { messageIds: string[] };

    // Check if user is member of conversation
    const membership = await fastify.prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId: decoded.userId,
      },
    });

    if (!membership) {
      return reply.code(403).send({ error: "Not a member of this conversation" });
    }

    // Create read receipts
    await fastify.prisma.readReceipt.createMany({
      data: messageIds.map((messageId) => ({
        messageId,
        userId: decoded.userId,
      })),
      skipDuplicates: true,
    });

    reply.send({ success: true });
  });
};

export default messageRoutes;
