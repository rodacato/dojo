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

# Install Piston runtimes (TypeScript, Python, Go, Ruby, SQL)
echo "Waiting for Piston..."
until curl -sf http://piston:2000/api/v2/runtimes > /dev/null 2>&1; do
  sleep 2
done
echo "Piston is ready. Installing runtimes..."

for pkg in typescript python ruby go sqlite3; do
  echo "  Installing $pkg..."
  curl -sf http://piston:2000/api/v2/packages -d "{\"language\":\"$pkg\",\"version\":\"*\"}" \
    -H "Content-Type: application/json" > /dev/null 2>&1 || echo "  ⚠ $pkg install failed (may already exist)"
done
echo "Piston runtimes installed."

echo "Running database migrations..."
pnpm --filter=@dojo/api db:migrate
echo "Migrations complete."

echo "Seeding course data..."
pnpm --filter=@dojo/api db:seed:courses 2>/dev/null || echo "Course seed skipped (may already exist)."

echo ""
echo "  dojo_ ready."
echo "  Run: pnpm dev"
echo ""
