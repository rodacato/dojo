#!/bin/sh
set -e

if [ -z "${API_HOST:-}" ]; then
  echo "API_HOST must be set to the API's public hostname (it goes into the CSP connect-src)" >&2
  exit 1
fi
