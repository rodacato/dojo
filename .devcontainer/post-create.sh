#!/bin/bash
set -e

cd /workspaces/dojo

# The devcontainer image ships some global node_modules subdirs (pnpm,
# @anthropic-ai/claude-code) as root-owned, which blocks `npm i -g X` and
# in-place upgrades (e.g. `npm i -g @anthropic-ai/claude-code`) from the
# vscode user with EACCES. Chown the whole global node_modules tree back
# to vscode:nvm so subsequent `npm i -g` works without sudo. Idempotent —
# subsequent rebuilds with already-correct ownership are no-ops.
sudo chown -R vscode:nvm /usr/local/share/nvm/current/lib/node_modules 2>/dev/null || true

# Enable corepack; it resolves pnpm from packageManager in package.json.
corepack enable

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
if grep -q "^FF_CODE_EXECUTION_ENABLED=false" .env 2>/dev/null; then
  sed -i 's/^FF_CODE_EXECUTION_ENABLED=false/FF_CODE_EXECUTION_ENABLED=true/' .env
  echo "Enabled FF_CODE_EXECUTION_ENABLED in .env"
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

echo "Seeding scroll catalog..."
pnpm --filter=@dojo/api db:seed:scrolls 2>/dev/null || echo "Scroll seed skipped (may already exist)."

# Playwright browsers for E2E smoke tests — skipped silently in hosts where
# the browser cache is already warm. System deps (libnss3, libasound2, etc.)
# must be installed by the container image or manually via
# `sudo pnpm exec playwright install-deps`.
echo "Installing Playwright browser (chromium)..."
pnpm exec playwright install chromium || echo "WARNING: Playwright chromium install failed; E2E tests will not run." >&2

# Kamal, for the read-only deploy commands (`kamal config`, `app details`,
# `logs`, `audit`). Deploys still run in CI — nothing installed here holds a
# secret. Version tracks .github/workflows/deploy.yml's KAMAL_VERSION.
if ! gem list -i '^kamal$' -v 2.12.0 >/dev/null 2>&1; then
  echo "Installing Kamal..."
  gem install kamal -v 2.12.0 --no-document
fi

# Load the non-secret Kamal environment in every shell. Idempotent across rebuilds.
for rc in "$HOME/.bashrc" "$HOME/.zshrc"; do
  [ -f "$rc" ] || continue
  grep -q 'devcontainer/kamal-env.sh' "$rc" && continue
  {
    echo ''
    echo 'export DOJO_ROOT="/workspaces/dojo"'
    echo '[ -r "$DOJO_ROOT/.devcontainer/kamal-env.sh" ] && . "$DOJO_ROOT/.devcontainer/kamal-env.sh"'
  } >> "$rc"
done

echo ""
echo "  dojo_ ready."
echo "  Run: pnpm dev"
echo ""
