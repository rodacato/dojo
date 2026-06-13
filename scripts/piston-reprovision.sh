#!/usr/bin/env bash
# piston-reprovision.sh — idempotent install of the Piston runtimes this
# product depends on. Reads the source-of-truth list below, checks what
# is already present, installs anything missing, verifies the final set.
#
# Intended use: after a Piston accessory reboot (the `dojo-piston-packages`
# named volume persists across app deploys, but NOT across volume resets).
# Safe to run in steady state — an already-present runtime is a no-op.
#
# Usage:
#   PISTON_URL=http://localhost:2000 ./scripts/piston-reprovision.sh
#
# On the Hetzner host, PISTON_URL is typically http://<host_ip>:2000
# (Piston listens on the host via the Kamal accessory). From a shell
# attached to the app container: use http://piston:2000.
#
# See ADR 018 for the why (sandboxing flags, packages volume, pinned
# image digest). See docs/specs/027-sprint-022-playground.md §1 for the
# sprint context (Part 1 hardening, liveness + multi-version decisions).

set -euo pipefail

PISTON_URL="${PISTON_URL:-http://localhost:2000}"

# Source of truth lives in TypeScript:
#   apps/api/src/infrastructure/execution/piston-runtimes.ts
# The list below MUST stay byte-equivalent (language version, one per line);
# piston-runtimes.parity.test.ts is the CI gate that asserts they match.
# This script exists as the emergency fallback for when the API itself is
# unreachable — the admin UI at /admin/scrolls is the normal path.
#
# Adding a runtime or version: edit the TS const first, then mirror here,
# then run `pnpm test --filter=api` to confirm parity. Keep sorted by
# language for diff readability.
#
# Runtime bump status: blocked upstream — engineer-man/piston ships only
# go=1.16.2, ruby up to 3.0.1, rust up to 1.68.2. Bumping requires either
# a maintained fork or a custom image layer (tracked in the backlog).
RUNTIMES=(
  "go 1.16.2"
  "python 3.10.0"
  "python 3.12.0"
  "ruby 3.0.1"
  "rust 1.68.2"
  "sqlite3 3.36.0"
  "typescript 5.0.3"
)

command -v curl >/dev/null || { echo "ERROR: curl not found" >&2; exit 2; }
command -v jq   >/dev/null || { echo "ERROR: jq not found"   >&2; exit 2; }

echo "=== piston-reprovision ==="
echo "PISTON_URL=${PISTON_URL}"
echo ""

# Fetch currently-installed runtimes once up front. If the endpoint is
# unreachable we fail fast — the rest of the script is meaningless.
if ! installed_json=$(curl -sfS "${PISTON_URL}/api/v2/runtimes"); then
  echo "ERROR: could not reach ${PISTON_URL}/api/v2/runtimes" >&2
  exit 1
fi

echo "Currently installed:"
echo "${installed_json}" | jq -r '.[] | "  - \(.language) \(.version)"' || echo "  (none)"
echo ""

installed_count=0
skipped_count=0

for entry in "${RUNTIMES[@]}"; do
  language="${entry% *}"
  version="${entry#* }"

  already=$(echo "${installed_json}" | jq -r \
    --arg l "$language" --arg v "$version" \
    '.[] | select(.language == $l and .version == $v) | .language // empty')

  if [ -n "${already}" ]; then
    echo "✓ ${language} ${version} already installed"
    skipped_count=$((skipped_count + 1))
    continue
  fi

  echo "→ installing ${language} ${version}..."
  http_body=$(mktemp)
  trap 'rm -f "${http_body}"' EXIT
  status=$(curl -sS -o "${http_body}" -w '%{http_code}' \
    -X POST "${PISTON_URL}/api/v2/packages" \
    -H 'Content-Type: application/json' \
    -d "{\"language\":\"${language}\",\"version\":\"${version}\"}")

  if [ "${status}" = "200" ]; then
    echo "  ok"
    installed_count=$((installed_count + 1))
  else
    echo "  FAILED HTTP ${status}:" >&2
    cat "${http_body}" >&2
    echo "" >&2
    exit 1
  fi
done

echo ""
echo "=== verification ==="
curl -sf "${PISTON_URL}/api/v2/runtimes" \
  | jq -r '.[] | "  ✓ \(.language) \(.version)"' \
  | sort

echo ""
echo "done. installed=${installed_count} skipped=${skipped_count} total=${#RUNTIMES[@]}"
