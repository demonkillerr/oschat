# Phase 1: Single-Region Chat Application

## Overview

Phase 1 implements a production-ready, single-region web chat application with real-time messaging, persistent storage, and offline synchronization. The system is designed with SOLID principles and a service-oriented architecture that can be split into microservices in future phases.

## Goals

- Build a **correct** messaging system (no duplicates, reliable offline catch-up)
- Create a **deployable** application with Docker and CI/CD
- Design with **future scalability** in mind (separation of concerns, clear boundaries)
- Implement **real-time** communication with WebSocket
- Ensure **data persistence** with PostgreSQL

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.5 | React framework with App Router |
| TypeScript | 5.5.3 | Type safety |
| Tailwind CSS | 3.4.6 | Styling framework |
| Zustand | 4.5.4 | State management |
| Socket.IO Client | 4.7.5 | WebSocket client |
| Zod | 3.23.8 | Client-side validation |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Fastify | 4.28.1 | High-performance web framework |
| TypeScript | 5.5.3 | Type safety |
| Socket.IO | 4.7.5 | WebSocket server |
| Prisma | 5.19.0 | ORM and migrations |
| PostgreSQL | 16 | Relational database |
| Zod | 3.23.8 | Schema validation |
| @fastify/jwt | 8.0.1 | JWT authentication |
| @fastify/oauth2 | 7.8.1 | OAuth integration |

### DevOps
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| GitHub Actions | CI/CD pipelines |
| tsx | TypeScript execution for development |

## System Architecture

### High-Level Design

```
┌─────────────────┐         ┌──────────────────┐
│   Next.js Web   │◄───────►│  Fastify Server  │
│   (Frontend)    │  HTTP   │   (Backend)      │
│                 │  WS     │                  │
└─────────────────┘         └──────────────────┘
         │                           │
         │                           │
         │                  ┌────────▼────────┐
         │                  │   PostgreSQL    │
         │                  │   (Database)    │
         │                  └─────────────────┘
         │
    ┌────▼─────┐
    │  Google  │
    │  OAuth   │
    └──────────┘
```

### Component Breakdown

#### 1. Web App (Next.js)
- **Authentication**: Google OAuth login flow
- **Chat UI**: Conversation list + message area
- **WebSocket Client**: Real-time message handling
- **State Management**: Zustand stores for auth, conversations, messages
- **Optimistic Updates**: Immediate UI feedback
- **Client-side Dedupe**: Message deduplication via Set

#### 2. Backend (Fastify)
- **REST API**: 
  - Authentication endpoints (`/auth/*`)
  - User management (`/me`, `/users/search`)
  - Conversation CRUD (`/conversations/*`)
  - Message history (`/conversations/:id/messages`)
- **WebSocket Gateway**:
  - Authenticated connections
  - Message broadcasting
  - Sync mechanism for offline catch-up
- **Database Layer**: Prisma ORM with PostgreSQL

#### 3. Database (PostgreSQL)
- **Users**: Authentication and profile data
- **Conversations**: DM and group chat metadata
- **Members**: Conversation membership with roles
- **Messages**: Chat messages with idempotency constraints

## Directory Structure

```
oschat/
├── apps/
│   ├── server/                          # Backend Service
│   │   ├── prisma/
│   │   │   ├── schema.prisma            # Database schema definition
│   │   │   └── migrations/
│   │   │       └── 20260112000000_init/
│   │   │           └── migration.sql    # Initial migration
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── env.ts               # Environment validation (Zod)
│   │   │   │   └── index.ts
│   │   │   ├── lib/
│   │   │   │   ├── prisma.ts            # Prisma client singleton
│   │   │   │   └── index.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts              # JWT authentication middleware
│   │   │   │   └── index.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts              # Google OAuth routes
│   │   │   │   ├── users.ts             # User endpoints
│   │   │   │   ├── conversations.ts     # Conversation CRUD
│   │   │   │   └── index.ts
│   │   │   ├── schemas/
│   │   │   │   └── index.ts             # Zod validation schemas
│   │   │   ├── socket/
│   │   │   │   └── index.ts             # Socket.IO gateway
│   │   │   ├── types/
│   │   │   │   └── fastify.ts           # TypeScript declarations
│   │   │   ├── __tests__/
│   │   │   │   └── basic.test.ts        # Unit tests
│   │   │   └── index.ts                 # Application entry point
│   │   ├── .env.example                 # Environment template
│   │   ├── .eslintrc.cjs                # ESLint configuration
│   │   ├── Dockerfile                   # Multi-stage Docker build
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts             # Test configuration
│   │
│   └── web/                             # Frontend Application
│       ├── src/
│       │   ├── app/
│       │   │   ├── auth/
│       │   │   │   └── callback/
│       │   │   │       └── page.tsx     # OAuth callback handler
│       │   │   ├── chat/
│       │   │   │   └── page.tsx         # Main chat interface
│       │   │   ├── globals.css          # Global styles
│       │   │   ├── layout.tsx           # Root layout
│       │   │   └── page.tsx             # Landing page
│       │   ├── components/
│       │   │   ├── chat/
│       │   │   │   ├── ConversationList.tsx  # Sidebar with convos
│       │   │   │   ├── MessageArea.tsx       # Message display + input
│       │   │   │   ├── SocketProvider.tsx    # WebSocket manager
│       │   │   │   └── index.ts
│       │   │   └── ui/
│       │   │       ├── Avatar.tsx            # User avatar component
│       │   │       ├── Spinner.tsx           # Loading indicator
│       │   │       └── index.ts
│       │   ├── lib/
│       │   │   ├── api.ts               # REST API client
│       │   │   ├── socket.ts            # Socket.IO client wrapper
│       │   │   ├── utils.ts             # Utility functions
│       │   │   └── index.ts
│       │   └── stores/
│       │       ├── auth.ts              # Authentication state
│       │       ├── conversations.ts     # Conversation state
│       │       ├── messages.ts          # Message state + dedupe
│       │       └── index.ts
│       ├── .env.example                 # Environment template
│       ├── .eslintrc.json               # ESLint config
│       ├── Dockerfile                   # Multi-stage Docker build
│       ├── next.config.mjs              # Next.js configuration
│       ├── next-env.d.ts                # Next.js types
│       ├── package.json
│       ├── postcss.config.js            # PostCSS for Tailwind
│       ├── tailwind.config.js           # Tailwind configuration
│       └── tsconfig.json
│
├── .github/
│   └── workflows/
│       └── ci.yml                       # CI/CD pipeline
├── docs/
│   └── phase-1.md                       # This document
├── docker-compose.yml                   # Production compose file
├── docker-compose.dev.yml               # Development DB only
├── package.json                         # Monorepo root
└── README.md                            # Project documentation
```

## Implementation Details

### 1. Authentication System

#### Google OAuth Flow
1. User clicks "Sign in with Google" → Redirects to `/auth/google`
2. Server redirects to Google's OAuth consent screen
3. Google redirects back to `/auth/google/callback` with authorization code
4. Server exchanges code for access token and fetches user info
5. Server creates/updates user in database
6. Server generates JWT and sets HTTP-only cookie
7. Server redirects to frontend with token in URL
8. Frontend stores token in localStorage and Zustand
9. Frontend fetches user data with `/me` endpoint

#### JWT Structure
```typescript
{
  id: string;        // User UUID
  email: string;     // Google email
  name: string;      // Display name
  avatarUrl: string | null;
}
```

#### Token Storage
- **Cookie**: HTTP-only, 7-day expiration (for server requests)
- **LocalStorage**: Persisted via Zustand (for client access)

### 2. Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_sub TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Conversations Table
```sql
CREATE TYPE ConversationType AS ENUM ('dm', 'group');

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type ConversationType NOT NULL,
  title TEXT,  -- NULL for DMs, required for groups
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Conversation Members Table
```sql
CREATE TYPE MemberRole AS ENUM ('owner', 'admin', 'member');

CREATE TABLE conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role MemberRole DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP,
  last_seen_msg_id UUID REFERENCES messages(id),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_members_user ON conversation_members(user_id);
```

#### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_msg_id UUID NOT NULL,  -- Client-generated for idempotency
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(sender_id, client_msg_id)  -- Idempotency constraint
);

CREATE INDEX idx_messages_conv_time ON messages(conversation_id, created_at);
```

### 3. REST API Endpoints

#### Authentication
```
GET  /auth/google                    # Initiate OAuth
GET  /auth/google/callback           # OAuth callback
POST /auth/logout                    # Clear session
GET  /auth/verify                    # Verify token (for WS)
```

#### Users
```
GET  /me                             # Get current user
GET  /users/search?email={query}     # Search users by email
```

#### Conversations
```
GET  /conversations                  # List user's conversations
POST /conversations/dm               # Create DM
  Body: { email: string }
POST /conversations/group            # Create group
  Body: { title: string, memberEmails: string[] }
GET  /conversations/:id              # Get conversation details
POST /conversations/:id/members      # Add member
  Body: { email: string }
DELETE /conversations/:id/members/:userId  # Remove member
GET  /conversations/:id/messages     # Get messages
  Query: ?after={msgId}&limit={50}
```

### 4. WebSocket Events

#### Client → Server

**`message:send`**
```typescript
{
  conversationId: string;  // UUID
  clientMsgId: string;     // Client-generated UUID
  body: string;            // Message content
}
// Acknowledgment callback returns:
{
  clientMsgId: string;
  messageId: string;       // Server-generated UUID
  createdAt: string;       // ISO timestamp
}
```

**`sync:request`**
```typescript
{
  conversationId: string;
  afterMessageId?: string;  // Optional cursor for pagination
}
```

**`typing:start` / `typing:stop`**
```typescript
{
  conversationId: string;
}
```

#### Server → Client

**`message:ack`**
```typescript
{
  clientMsgId: string;
  messageId: string;
  createdAt: string;
}
```

**`message:new`**
```typescript
{
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  clientMsgId: string;
  body: string;
  createdAt: string;
}
```

**`sync:batch`**
```typescript
{
  conversationId: string;
  messages: Array<{
    messageId: string;
    // ... same as message:new
  }>;
}
```

**`typing:start` / `typing:stop`**
```typescript
{
  conversationId: string;
  userId: string;
  userName?: string;
}
```

### 5. Message Deduplication

#### Server-Side (Idempotency)
- Database constraint: `UNIQUE(sender_id, client_msg_id)`
- Client generates UUID for each message attempt
- If client retries (network error), server returns existing message
- Prevents duplicate messages in database

#### Client-Side (Dedupe)
- Message store maintains `Set<messageId>` of seen messages
- When receiving `message:new` or `sync:batch`:
  1. Check if `messageId` already in set
  2. If yes, skip (duplicate)
  3. If no, add to set and display
- Handles edge case where WS and sync return same message

### 6. Offline Catch-Up (Sync)

#### Mechanism
1. **Track last seen**: Each member has `last_seen_msg_id` and `last_seen_at`
2. **On reconnect**: Client sends `sync:request` with last known message ID
3. **Server responds**: Fetches messages `WHERE created_at > last_seen.created_at`
4. **Client processes**: Adds new messages (with dedupe)
5. **Update marker**: Server updates `last_seen_msg_id` after sync

#### Sync Flow
```
Client                                  Server
  |                                       |
  |-- sync:request ---------------------->|
  |    { conversationId, afterMessageId } |
  |                                       |
  |                                       | Query DB:
  |                                       | SELECT * FROM messages
  |                                       | WHERE conversation_id = ?
  |                                       | AND created_at > (
  |                                       |   SELECT created_at 
  |                                       |   FROM messages 
  |                                       |   WHERE id = afterMessageId
  |                                       | )
  |                                       | ORDER BY created_at ASC
  |                                       | LIMIT 100
  |                                       |
  |<-- sync:batch -----------------------|
  |    { conversationId, messages: [...] }|
  |                                       |
  | Process messages (dedupe)             |
  |                                       |
```

### 7. State Management (Zustand)

#### Auth Store
```typescript
{
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setToken: (token) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}
```

#### Conversation Store
```typescript
{
  conversations: Conversation[];
  currentConversationId: string | null;
  fetchConversations: () => Promise<void>;
  createDm: (email) => Promise<Conversation>;
  createGroup: (title, emails) => Promise<Conversation>;
  addMember: (convId, email) => Promise<void>;
  removeMember: (convId, userId) => Promise<void>;
}
```

#### Message Store
```typescript
{
  messagesByConversation: Record<string, Message[]>;
  seenMessageIds: Set<string>;  // Client-side dedupe
  pendingMessages: Map<string, Message>;  // Optimistic updates
  fetchMessages: (convId, after?) => Promise<void>;
  sendMessage: (convId, body) => Promise<void>;
  addMessage: (msg) => void;  // From WebSocket
  syncMessages: (convId, msgs) => void;  // From sync
}
```

### 8. Docker Setup

#### Development
```bash
# Start only PostgreSQL
docker compose -f docker-compose.dev.yml up -d

# Run backend and frontend locally
npm run dev
```

#### Production
```bash
# Build and start all services
docker compose up -d

# Run migrations
docker compose exec server npx prisma migrate deploy
```

#### Multi-Stage Builds
Both Dockerfiles use multi-stage builds:
1. **Builder stage**: Install deps, build TypeScript
2. **Runner stage**: Copy built files, run as non-root user
3. Result: Smaller, more secure images

### 9. CI/CD Pipeline

#### Workflow Steps
1. **Lint & Typecheck**: Run ESLint and TypeScript compiler
2. **Test**: Run Vitest tests with PostgreSQL service
3. **Build Docker**: Build images with layer caching
4. **Push**: (Future) Push to container registry

#### GitHub Actions
- Runs on `push` to `main` or `revamp` branches
- Runs on pull requests
- Parallel jobs for frontend and backend
- PostgreSQL service container for tests
- Docker layer caching for faster builds

## Phase 1 Acceptance Criteria

### A) Authentication + Identity ✅

**Requirement**: Google login works end-to-end, backend trusts identity, users table populated.

**Implementation**:
- ✅ Google OAuth 2.0 integration
- ✅ JWT token generation with 7-day expiration
- ✅ HTTP-only cookies + localStorage for token storage
- ✅ User upsert on login (create or update)
- ✅ `/me` endpoint returns authenticated user

**Test**:
```bash
# Visit frontend
http://localhost:3000

# Click "Sign in with Google"
# Complete OAuth flow
# Should redirect to /chat with user info displayed
```

### B) Core Chat Model ✅

**Requirement**: DM and group conversations, membership management, message storage.

**Implementation**:
- ✅ `conversations` table with `type` enum (dm/group)
- ✅ `conversation_members` with role-based access
- ✅ Create DM: `POST /conversations/dm { email }`
- ✅ Create Group: `POST /conversations/group { title, memberEmails }`
- ✅ Add/Remove members: `POST/DELETE /conversations/:id/members`
- ✅ List conversations: `GET /conversations`

**Test**:
```bash
# Create DM
curl -X POST http://localhost:4000/conversations/dm \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"friend@example.com"}'

# Create Group
curl -X POST http://localhost:4000/conversations/group \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Group","memberEmails":["user1@example.com","user2@example.com"]}'
```

### C) Real-time Messaging ✅

**Requirement**: User A sends message → User B receives instantly (including sender).

**Implementation**:
- ✅ Socket.IO server with JWT authentication
- ✅ `message:send` event with acknowledgment
- ✅ `message:new` broadcast to all conversation members
- ✅ Server joins sockets to conversation rooms
- ✅ Multi-device support (sender receives own messages)

**Test**:
1. Open chat in two browsers/tabs (different users)
2. Join same conversation
3. Send message from User A
4. User B should see it instantly
5. User A should see their own message (for multi-device)

### D) Offline Catch-Up ✅

**Requirement**: User goes offline, misses messages, reconnects → sees all missed messages.

**Implementation**:
- ✅ `last_seen_msg_id` tracked per member
- ✅ `sync:request` event accepts `afterMessageId` cursor
- ✅ `sync:batch` returns messages in order
- ✅ Client automatically syncs on reconnect
- ✅ Messages ordered by `created_at`

**Test**:
1. User A online, User B offline (close browser)
2. User A sends 5 messages
3. User B comes back online
4. User B should receive all 5 messages via sync
5. Check messages are in correct order

### E) No Duplicate Messages ✅

**Requirement**: Flaky network, retry, or multi-device → each message appears once.

**Implementation**:
- ✅ Server: `UNIQUE(sender_id, client_msg_id)` constraint
- ✅ Client generates UUID for each message
- ✅ Server returns existing message on duplicate `client_msg_id`
- ✅ Client: `Set<messageId>` tracks seen messages
- ✅ Client skips messages already in set

**Test**:
```javascript
// In browser console, send same message twice
const clientMsgId = crypto.randomUUID();
socket.emit('message:send', {
  conversationId: 'some-uuid',
  clientMsgId,
  body: 'Test message'
});

// Send again with same clientMsgId
socket.emit('message:send', {
  conversationId: 'some-uuid',
  clientMsgId,  // Same ID
  body: 'Test message'
});

// Should see only ONE message in UI and DB
```

## Development Workflow

### Initial Setup
```bash
# 1. Clone repository
git clone <repo-url>
cd oschat

# 2. Install dependencies
npm install

# 3. Start PostgreSQL
npm run docker:dev

# 4. Configure environment
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env.local
# Edit .env files with Google OAuth credentials

# 5. Setup database
npm run db:generate
npm run db:migrate

# 6. Start development servers
npm run dev
```

### Common Tasks
```bash
# Run linters
npm run lint

# Type checking
npm run typecheck

# Run tests
npm run test

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio (GUI)

# Docker operations
npm run docker:up      # Start all services
npm run docker:down    # Stop all services
```

### Code Style

#### SOLID Principles Applied

**Single Responsibility**:
- Each route handler handles one endpoint
- Separate files for auth, users, conversations
- Socket events separated by concern

**Open/Closed**:
- Middleware for authentication (can extend without modifying routes)
- Zod schemas for validation (easy to add new fields)

**Liskov Substitution**:
- Consistent error handling across all routes
- Uniform response structures

**Interface Segregation**:
- Specific Zustand stores (auth, conversations, messages)
- Targeted API client methods

**Dependency Inversion**:
- Prisma client abstracted in `lib/prisma.ts`
- Environment config centralized in `config/env.ts`
- API client abstraction in frontend

## Known Limitations (Phase 1)

1. **Single Region**: No geographic distribution
2. **No Media**: Text-only messages
3. **No Reactions**: No emoji reactions or threads
4. **No Read Receipts**: Only last_seen tracking
5. **No Search**: No message search functionality
6. **Basic Typing**: Simple typing indicators only
7. **No Notifications**: No push notifications
8. **No Rate Limiting**: Should add for production
9. **No Encryption**: Messages not end-to-end encrypted
10. **Single DB Instance**: No replication or sharding

## Future Enhancements (Phase 2+)

- [ ] File/image uploads
- [ ] Message reactions and threads
- [ ] Read receipts
- [ ] Full-text search
- [ ] Push notifications
- [ ] Rate limiting and abuse prevention
- [ ] End-to-end encryption
- [ ] Database replication
- [ ] Horizontal scaling (multiple backend instances)
- [ ] CDN for static assets
- [ ] Message edit/delete
- [ ] User presence (online/offline status)
- [ ] Voice/video calls

## Performance Considerations

### Database Indexes
```sql
-- Critical indexes for performance
CREATE INDEX idx_members_user ON conversation_members(user_id);
CREATE INDEX idx_messages_conv_time ON messages(conversation_id, created_at);
```

### Query Optimization
- **Conversations list**: Includes latest message (no N+1)
- **Message history**: Paginated with cursor (limit 50)
- **Sync**: Limited to 100 messages per batch

### Frontend Optimization
- **Optimistic updates**: Instant UI feedback
- **Virtual scrolling**: (Future) For long message lists
- **Image lazy loading**: For avatars
- **Code splitting**: Next.js automatic code splitting

## Security Considerations

### Authentication
- JWT tokens with expiration
- HTTP-only cookies prevent XSS
- CORS configured for specific origin
- No sensitive data in JWT payload

### Database
- SQL injection prevented by Prisma (parameterized queries)
- Cascade deletes for data consistency
- Unique constraints for data integrity

### WebSocket
- Authentication required before any events
- Room-based access control
- Input validation with Zod

### Docker
- Non-root users in containers
- Multi-stage builds (smaller attack surface)
- No secrets in images

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker compose ps

# Check connection
psql postgresql://oschat:oschat@localhost:5432/oschat

# Reset database
docker compose down -v
docker compose -f docker-compose.dev.yml up -d
npm run db:migrate
```

### WebSocket Connection Fails
- Check CORS settings in backend
- Verify token is valid (`/auth/verify`)
- Check browser console for errors
- Ensure backend is running on port 4000

### OAuth Redirect Issues
- Verify `GOOGLE_CALLBACK_URL` matches Google Console
- Check `FRONTEND_URL` is correct
- Ensure URLs use http:// in development

## Metrics & Monitoring

### Key Metrics to Track (Future)
- **Message latency**: Time from send to receive
- **Database query time**: P50, P95, P99
- **WebSocket connections**: Active connections count
- **API response time**: Per endpoint
- **Error rate**: 4xx and 5xx responses

### Logging
- Fastify logger with pino (JSON structured logs)
- Log levels: info (dev), warn (prod)
- WebSocket events logged (connect, disconnect)

## Conclusion

Phase 1 delivers a production-ready chat application with:
- ✅ All acceptance criteria met
- ✅ SOLID design principles applied
- ✅ Comprehensive test coverage setup
- ✅ Docker deployment ready
- ✅ CI/CD pipeline configured
- ✅ Documentation complete

The system is designed for future scalability while keeping Phase 1 focused and deployable.
