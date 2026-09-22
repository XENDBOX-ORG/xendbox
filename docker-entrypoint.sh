#!/bin/sh
set -e

# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Start the app
exec npx tsx apps/api/src/index.ts
