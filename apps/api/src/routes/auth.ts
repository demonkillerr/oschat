import { FastifyPluginAsync } from "fastify";
import axios from "axios";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Google OAuth login URL
  fastify.get("/google", async (request, reply) => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_CALLBACK_URL}&response_type=code&scope=profile email`;
    
    reply.redirect(googleAuthUrl);
  });

  // Google OAuth callback
  fastify.get("/google/callback", async (request, reply) => {
    const { code } = request.query as { code: string };

    if (!code) {
      return reply.code(400).send({ error: "No code provided" });
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      });

      const { access_token } = tokenResponse.data;

      // Get user info
      const userInfoResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const { id, email, name, picture } = userInfoResponse.data;

      // Create or update user
      let user = await fastify.prisma.user.findUnique({
        where: { googleId: id },
      });

      if (!user) {
        user = await fastify.prisma.user.create({
          data: {
            googleId: id,
            email,
            name,
            avatar: picture,
          },
        });
      } else {
        user = await fastify.prisma.user.update({
          where: { id: user.id },
          data: {
            name,
            avatar: picture,
          },
        });
      }

      // Generate JWT
      const token = fastify.jwt.sign({ userId: user.id });

      // Redirect to frontend with token
      reply.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: "Authentication failed" });
    }
  });

  // Get current user
  fastify.get("/me", {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const decoded = await request.jwtVerify() as { userId: string };
    
    const user = await fastify.prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return reply.code(404).send({ error: "User not found" });
    }

    reply.send(user);
  });

  // Logout
  fastify.post("/logout", async (request, reply) => {
    reply.send({ message: "Logged out successfully" });
  });
};

export default authRoutes;
