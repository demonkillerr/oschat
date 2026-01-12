FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 oschat

# Copy necessary files
COPY --from=builder --chown=oschat:nodejs /app/package*.json ./
COPY --from=builder --chown=oschat:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=oschat:nodejs /app/apps/server ./apps/server
COPY --from=builder --chown=oschat:nodejs /app/packages/shared ./packages/shared

USER oschat

EXPOSE 4000

CMD ["npm", "run", "start", "--workspace=@oschat/server"]
