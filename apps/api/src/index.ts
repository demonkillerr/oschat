import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth";
import conversationRoutes from "./routes/conversations";
import messageRoutes from "./routes/messages";
import { setupSocketIO } from "./socket";

dotenv.config();

const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

async function start() {
  try {
    // Register plugins
    await fastify.register(cors, {
      origin: FRONTEND_URL,
      credentials: true,
    });

    await fastify.register(cookie);

    await fastify.register(jwt, {
      secret: process.env.JWT_SECRET || "super-secret-key",
      cookie: {
        cookieName: "token",
        signed: false,
      },
    });

    // Decorate fastify with prisma
    fastify.decorate("prisma", prisma);

    // Decorate fastify with authenticate method
    fastify.decorate("authenticate", async function (request: any, reply: any) {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.code(401).send({ error: "Unauthorized" });
      }
    });

    // Register routes
    await fastify.register(authRoutes, { prefix: "/auth" });
    await fastify.register(conversationRoutes, { prefix: "/conversations" });
    await fastify.register(messageRoutes, { prefix: "/messages" });

    // Health check
    fastify.get("/health", async () => {
      return { status: "ok" };
    });

    // Start server
    await fastify.listen({ port: PORT as number, host: "0.0.0.0" });

    // Setup Socket.IO
    const io = new Server(fastify.server, {
      cors: {
        origin: FRONTEND_URL,
        credentials: true,
      },
    });

    setupSocketIO(io, prisma);

    console.log(`Server running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();
