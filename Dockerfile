# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json tsconfig.base.json ./

# Copy all workspace package manifests and sources (workspace-hoisted deps)
COPY packages ./packages
COPY apps/api/package.json apps/api/

# Install all dependencies (workspace hoisted)
RUN npm ci --ignore-scripts

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the API source
COPY apps/api/src apps/api/src

# ---- Runtime Stage ----
FROM node:22-alpine AS runtime

WORKDIR /app

# Copy node_modules (hoisted from builder, includes Prisma client and tsx)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy workspace packages and Prisma client
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["npx", "tsx", "apps/api/src/index.ts"]