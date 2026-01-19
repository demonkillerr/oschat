import { FastifyPluginAsync } from "fastify";

const conversationRoutes: FastifyPluginAsync = async (fastify) => {
  // Search users (for creating conversations) - MUST BE BEFORE /:id route
  fastify.get("/users/search", {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const decoded = await request.jwtVerify() as { userId: string };
    const { q } = request.query as { q?: string };

    const users = await fastify.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: decoded.userId } },
          q ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
            ],
          } : {},
        ],
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        email: true,
      },
      take: 20,
    });

    reply.send(users);
  });

  // Get all conversations for current user
  fastify.get("/", {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const decoded = await request.jwtVerify() as { userId: string };

    const conversations = await fastify.prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId: decoded.userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                email: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    reply.send(conversations);
  });

  // Create a new conversation (1:1 or group)
  fastify.post("/", {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const decoded = await request.jwtVerify() as { userId: string };
    const { type, memberIds, name } = request.body as {
      type: "direct" | "group";
      memberIds: string[];
      name?: string;
    };

    // Validate
    if (type === "direct" && memberIds.length !== 1) {
      return reply.code(400).send({ error: "Direct conversations must have exactly 1 other member" });
    }

    if (type === "group" && memberIds.length < 2) {
      return reply.code(400).send({ error: "Group conversations must have at least 2 other members" });
    }

    // Check if direct conversation already exists
    if (type === "direct") {
      const existingConversation = await fastify.prisma.conversation.findFirst({
        where: {
          type: "direct",
          members: {
            every: {
              userId: {
                in: [decoded.userId, memberIds[0]],
              },
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (existingConversation && existingConversation.members.length === 2) {
        return reply.send(existingConversation);
      }
    }

    // Create conversation
    const allMemberIds = [decoded.userId, ...memberIds];
    const conversation = await fastify.prisma.conversation.create({
      data: {
        type,
        name: type === "group" ? name : null,
        members: {
          create: allMemberIds.map((id) => ({
            userId: id,
          })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                email: true,
              },
            },
          },
        },
      },
    });

    reply.send(conversation);
  });

  // Get conversation by ID
  fastify.get("/:id", {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const decoded = await request.jwtVerify() as { userId: string };
    const { id } = request.params as { id: string };

    const conversation = await fastify.prisma.conversation.findFirst({
      where: {
        id,
        members: {
          some: {
            userId: decoded.userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return reply.code(404).send({ error: "Conversation not found" });
    }

    reply.send(conversation);
  });

  // Add members to group conversation
  fastify.post("/:id/members", {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const decoded = await request.jwtVerify() as { userId: string };
    const { id } = request.params as { id: string };
    const { memberIds } = request.body as { memberIds: string[] };

    // Check if conversation exists and user is a member
    const conversation = await fastify.prisma.conversation.findFirst({
      where: {
        id,
        type: "group",
        members: {
          some: {
            userId: decoded.userId,
          },
        },
      },
    });

    if (!conversation) {
      return reply.code(404).send({ error: "Group conversation not found" });
    }

    // Add members
    await fastify.prisma.conversationMember.createMany({
      data: memberIds.map((userId) => ({
        conversationId: id,
        userId,
      })),
    });

    const updatedConversation = await fastify.prisma.conversation.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                email: true,
              },
            },
          },
        },
      },
    });

    reply.send(updatedConversation);
  });
};

export default conversationRoutes;
