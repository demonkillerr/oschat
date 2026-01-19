# OSChat Application

OSChat is a real-time bidirectional chat application with 1:1 and group chat support.

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, Shadcn UI
- **Backend**: Fastify, Socket.io
- **Database**: SQLite with Prisma
- **Authentication**: Google OAuth 2.0
- **Monorepo**: Turborepo

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm db:generate

# Push database schema
npm db:push

# Run development servers
npm dev
```

### Environment Variables

Create `.env` files in `apps/web` and `apps/api`:

**apps/web/.env.local**:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

**apps/api/.env**:
```
DATABASE_URL="file:./dev.db"
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:3000
PORT=3001
```

## Project Structure

```
oschat/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Fastify backend
├── packages/
│   ├── types/        # Shared TypeScript types
│   └── ui/           # Shadcn components
└── turbo.json        # Turborepo configuration
```

## Features

- Google OAuth authentication
- 1:1 direct messaging
- Group chats
- Real-time message delivery
- Typing indicators
- Online/offline status
- Read receipts
- Message history



## Development

- `npm dev` - Run all apps in development mode
- `npm build` - Build all apps
- `npm lint` - Lint all apps
- `npm db:studio` - Open Prisma Studio