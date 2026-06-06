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

# Enable Piston in dev by default
if grep -q "^CODE_EXECUTION_ENABLED=false" .env 2>/dev/null; then
  sed -i 's/^CODE_EXECUTION_ENABLED=false/CODE_EXECUTION_ENABLED=true/' .env
  echo "Enabled CODE_EXECUTION_ENABLED in .env"
fi

# Install Piston runtimes — delegated to the canonical, idempotent
# reprovision script so dev and prod share one source-of-truth list
# of runtimes + pinned versions (see scripts/piston-reprovision.sh).
echo "Waiting for Piston..."
until curl -sf http://piston:2000/api/v2/runtimes > /dev/null 2>&1; do
  sleep 2
done
PISTON_URL=http://piston:2000 ./scripts/piston-reprovision.sh

echo "Running database migrations..."
pnpm --filter=@dojo/api db:migrate
echo "Migrations complete."

echo "Seeding course data..."
pnpm --filter=@dojo/api db:seed:courses 2>/dev/null || echo "Course seed skipped (may already exist)."

# Playwright browsers for E2E smoke tests — skipped silently in hosts where
# the browser cache is already warm. System deps (libnss3, libasound2, etc.)
# must be installed by the container image or manually via
# `sudo pnpm exec playwright install-deps`.
echo "Installing Playwright browser (chromium)..."
pnpm exec playwright install chromium 2>/dev/null || echo "Playwright install skipped."

echo ""
echo "  dojo_ ready."
echo "  Run: pnpm dev"
echo ""
