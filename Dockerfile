# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json ./

# Copy all workspace package.json files
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/
COPY packages/notifications/package.json packages/notifications/
COPY packages/auth/package.json packages/auth/
COPY packages/shared/package.json packages/shared/
COPY packages/types/package.json packages/types/
COPY packages/validation/package.json packages/validation/
COPY packages/maps/package.json packages/maps/

# Install all dependencies (workspace hoisted)
RUN npm ci --ignore-scripts

# Copy source files
COPY tsconfig.base.json ./
COPY apps/api/tsconfig.json apps/api/
COPY apps/api/src apps/api/src
COPY packages/notifications/src packages/notifications/src
COPY packages/database/src packages/database/src

# ---- Runtime Stage ----
FROM node:22-alpine AS runtime

WORKDIR /app

# Copy node_modules (hoisted from builder)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy workspace packages
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["npx", "tsx", "apps/api/src/index.ts"]
