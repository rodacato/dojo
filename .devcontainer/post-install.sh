#!/bin/bash
set -e

cd /workspaces/dojo

# Enable corepack for pnpm
corepack enable
corepack prepare pnpm@latest --activate

# Install turbo globally
npm install -g turbo

# Install dependencies
pnpm install

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
until pg_isready -h db -p 5432 -U dojo 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL is ready."

# Copy .env if it doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo ".env created from .env.example — fill in your secrets."
fi

echo ""
echo "  dojo_ ready."
echo "  Run: pnpm dev"
echo ""
