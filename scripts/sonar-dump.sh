#!/usr/bin/env bash
# Dump SonarQube Reliability (BUG) + Security (VULNERABILITY) issues for the
# three dojo projects to JSON, feeding the S033 issue catalog
# (docs/audits/2026-06-issue-catalog.md). Maintainability (CODE_SMELL) is
# fetched as rule-facet counts only — 640 smells are the S035 long tail, not
# enumerated here.
#
# The self-hosted SonarQube is tailnet-only, so this runs from a machine on the
# tailnet, not from CI or a sandbox. Output lands in /tmp/sonar-dump/.
#
# Requires:
#   SONAR_HOST_URL  the instance base URL (same value as the GH Actions var)
#   SONAR_TOKEN     a user token with Browse permission on the projects
#
# Usage:
#   SONAR_HOST_URL=https://... SONAR_TOKEN=... ./scripts/sonar-dump.sh
set -euo pipefail
: "${SONAR_HOST_URL:?set SONAR_HOST_URL}"
: "${SONAR_TOKEN:?set SONAR_TOKEN}"

OUT=/tmp/sonar-dump
mkdir -p "$OUT"

for key in dojo-api dojo-web dojo-packages; do
  # Reliability + Security, full detail (≤500 each — well under one page).
  curl -sS -u "$SONAR_TOKEN:" \
    "$SONAR_HOST_URL/api/issues/search?componentKeys=$key&types=BUG,VULNERABILITY&resolved=false&ps=500&additionalFields=rules" \
    >"$OUT/$key-reliability-security.json"

  # Maintainability: rule-level counts only (the long tail), not every issue.
  curl -sS -u "$SONAR_TOKEN:" \
    "$SONAR_HOST_URL/api/issues/search?componentKeys=$key&types=CODE_SMELL&resolved=false&ps=1&facets=rules,severities" \
    >"$OUT/$key-maintainability-facets.json"

  echo "dumped $key"
done

echo
echo "Wrote JSON to $OUT/ — Reliability+Security in full, Maintainability as facets."
echo "Now tell Claude to read $OUT and fill the catalog."
