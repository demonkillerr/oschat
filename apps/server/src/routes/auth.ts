import { FastifyInstance } from 'fastify';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

export async function authRoutes(app: FastifyInstance) {
  // Initiate Google OAuth
  app.get('/google', async (request, reply) => {
    const redirectUri = env.GOOGLE_CALLBACK_URL;
    const scope = encodeURIComponent('openid email profile');
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${env.GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&access_type=offline` +
      `&prompt=consent`;

    return reply.redirect(googleAuthUrl);
  });

  // Google OAuth callback
  app.get('/google/callback', async (request, reply) => {
    const { code } = request.query as { code?: string };

    if (!code) {
      return reply.status(400).send({ error: 'Missing authorization code' });
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: env.GOOGLE_CALLBACK_URL,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        app.log.error('Token exchange failed:', error);
        return reply.status(400).send({ error: 'Failed to exchange code for tokens' });
      }

      const tokens = await tokenResponse.json() as GoogleTokenResponse;

      // Get user info
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userInfoResponse.ok) {
        return reply.status(400).send({ error: 'Failed to get user info' });
      }

      const googleUser = await userInfoResponse.json() as GoogleUserInfo;

      // Upsert user in database
      const user = await prisma.user.upsert({
        where: { googleSub: googleUser.sub },
        update: {
          email: googleUser.email,
          name: googleUser.name,
          avatarUrl: googleUser.picture || null,
        },
        create: {
          googleSub: googleUser.sub,
          email: googleUser.email,
          name: googleUser.name,
          avatarUrl: googleUser.picture || null,
        },
      });

      // Generate JWT
      const token = app.jwt.sign({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      }, { expiresIn: '7d' });

      // Set cookie and redirect to frontend
      reply.setCookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      // Redirect to frontend with token in URL for client-side storage
      return reply.redirect(`${env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      app.log.error('OAuth callback error:', error);
      return reply.status(500).send({ error: 'Authentication failed' });
    }
  });

  // Logout
  app.post('/logout', async (_request, reply) => {
    reply.clearCookie('token', { path: '/' });
    return { success: true };
  });

  // Verify token endpoint (for Socket.IO auth)
  app.get('/verify', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request) => {
    return { valid: true, user: request.user };
  });
}
