# OSChat

A real-time chat application built with TypeScript, Next.js, Fastify, and Socket.IO.

## Features

- **Real-time messaging** - Instant message delivery using WebSocket (Socket.IO)
- **Google OAuth** - Secure authentication with Google accounts
- **Direct Messages** - One-on-one conversations
- **Group Chats** - Create groups and add/remove members
- **Offline Sync** - Catch up on missed messages when reconnecting
- **No Duplicates** - Server-side idempotency + client-side deduplication

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- Socket.IO Client

### Backend
- Fastify
- TypeScript
- Socket.IO
- Prisma (ORM)
- PostgreSQL
- Zod (Validation)

### DevOps
- Docker & Docker Compose
- GitHub Actions (CI/CD)

## Project Structure

```
oschat/
├── apps/
│   ├── server/         # Fastify backend
│   │   ├── src/
│   │   │   ├── config/     # Environment configuration
│   │   │   ├── lib/        # Database client, utilities
│   │   │   ├── middleware/ # Auth middleware
│   │   │   ├── routes/     # REST API routes
│   │   │   ├── schemas/    # Zod schemas
│   │   │   ├── socket/     # Socket.IO gateway
│   │   │   └── index.ts    # App entry point
│   │   └── prisma/
│   │       └── schema.prisma
│   │
│   └── web/            # Next.js frontend
│       └── src/
│           ├── app/        # Pages and layouts
│           ├── components/ # React components
│           ├── lib/        # API client, socket client, utilities
│           └── stores/     # Zustand stores
│
├── docker-compose.yml      # Production compose
├── docker-compose.dev.yml  # Development compose (DB only)
└── .github/workflows/      # CI/CD pipelines
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Docker & Docker Compose
- Google OAuth credentials (from Google Cloud Console)

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/oschat.git
cd oschat
```

2. Copy environment files:
```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env.local
```

3. Configure the environment variables:

**apps/server/.env:**
```env
PORT=4000
HOST=0.0.0.0
NODE_ENV=development
DATABASE_URL=postgresql://oschat:oschat@localhost:5432/oschat?schema=public
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

**apps/web/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

### Development

1. Start the PostgreSQL database:
```bash
npm run docker:dev
```

2. Install dependencies:
```bash
npm install
```

3. Generate Prisma client and run migrations:
```bash
npm run db:generate
npm run db:migrate
```

4. Start the development servers:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:4000`.

### Production (Docker Compose)

1. Set up environment variables in a `.env` file at the root:
```env
JWT_SECRET=your-production-jwt-secret-minimum-32-characters
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

2. Build and start all services:
```bash
docker compose up -d
```

3. Run database migrations:
```bash
docker compose exec server npx prisma migrate deploy
```

## API Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/me` | Get current user |
| GET | `/auth/google` | Initiate Google OAuth |
| GET | `/auth/google/callback` | OAuth callback |
| POST | `/auth/logout` | Logout |
| GET | `/conversations` | List user's conversations |
| POST | `/conversations/dm` | Create DM conversation |
| POST | `/conversations/group` | Create group conversation |
| GET | `/conversations/:id` | Get conversation details |
| POST | `/conversations/:id/members` | Add member to group |
| DELETE | `/conversations/:id/members/:userId` | Remove member |
| GET | `/conversations/:id/messages` | Get messages (paginated) |

### WebSocket Events

**Client → Server:**
| Event | Payload | Description |
|-------|---------|-------------|
| `message:send` | `{ conversationId, clientMsgId, body }` | Send a message |
| `sync:request` | `{ conversationId, afterMessageId? }` | Request message sync |
| `typing:start` | `{ conversationId }` | Start typing indicator |
| `typing:stop` | `{ conversationId }` | Stop typing indicator |

**Server → Client:**
| Event | Payload | Description |
|-------|---------|-------------|
| `message:ack` | `{ clientMsgId, messageId, createdAt }` | Message acknowledgment |
| `message:new` | `{ messageId, conversationId, ... }` | New message broadcast |
| `sync:batch` | `{ conversationId, messages: [...] }` | Sync response |
| `typing:start` | `{ conversationId, userId, userName }` | User typing |
| `typing:stop` | `{ conversationId, userId }` | User stopped typing |

## Database Schema

```
users
├── id (UUID, PK)
├── google_sub (unique)
├── email (unique)
├── name
├── avatar_url
├── created_at
└── updated_at

conversations
├── id (UUID, PK)
├── type (dm | group)
├── title
├── created_at
└── updated_at

conversation_members
├── id (UUID, PK)
├── conversation_id (FK)
├── user_id (FK)
├── role (owner | admin | member)
├── joined_at
├── last_seen_at
└── last_seen_msg_id (FK)
├── UNIQUE(conversation_id, user_id)

messages
├── id (UUID, PK)
├── conversation_id (FK)
├── sender_id (FK)
├── client_msg_id
├── body
├── created_at
└── UNIQUE(sender_id, client_msg_id)  # Idempotency
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.
