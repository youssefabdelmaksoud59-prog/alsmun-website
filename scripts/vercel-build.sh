#!/bin/sh
# Runs on every Vercel deploy: updates the database tables, creates the committees
# the first time, then builds the site. Migrations need a direct (unpooled) connection,
# which the Neon integration provides as DATABASE_URL_UNPOOLED.
set -e
DB_DIRECT="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"
DATABASE_URL="$DB_DIRECT" npx prisma migrate deploy
DATABASE_URL="$DB_DIRECT" npx tsx prisma/seed.ts --if-empty
npm run build
