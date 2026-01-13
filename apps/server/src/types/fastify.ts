import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string;
      email: string;
      name: string;
      avatarUrl: string | null;
    } | null;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      name: string;
      avatarUrl: string | null;
    };
    user: {
      id: string;
      email: string;
      name: string;
      avatarUrl: string | null;
    };
  }
}

export type { FastifyInstance, FastifyRequest, FastifyReply };
