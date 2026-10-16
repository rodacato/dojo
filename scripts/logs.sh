#!/usr/bin/env bash
# Read production logs: kamal app logs, formatted by pino-pretty.
#   scripts/logs.sh -f                    follow
#   scripts/logs.sh -l warn               warn and above
#   scripts/logs.sh -r <requestId>        one request, end to end
#   scripts/logs.sh -e llm.               events whose name contains "llm."
#   scripts/logs.sh -s 1h -n 500          window and size
#   scripts/logs.sh -w                    web app instead of the API
set -euo pipefail

cd "$(dirname "$0")/.."

config=config/deploy.api.yml
level=info
lines=200
since=""
follow=""
request_id=""
event=""

usage() { sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

while getopts "fwl:r:e:s:n:h" opt; do
  case "$opt" in
    f) follow="-f" ;;
    w) config=config/deploy.web.yml ;;
    l) level="$OPTARG" ;;
    r) request_id="$OPTARG" ;;
    e) event="$OPTARG" ;;
    s) since="$OPTARG" ;;
    n) lines="$OPTARG" ;;
    h) usage ;;
    *) usage 1 ;;
  esac
done

kamal_args=(app logs -c "$config" --lines "$lines")
[ -n "$follow" ] && kamal_args+=("$follow")
[ -n "$since" ] && kamal_args+=(--since "$since")
[ -n "$request_id" ] && kamal_args+=(--grep "$request_id")

pretty=(pnpm --silent --filter @dojo/api exec pino-pretty
  --messageKey evt --ignore pid,hostname --translateTime 'HH:MM:ss.l' --minimumLevel "$level")

if [ -n "$event" ]; then
  kamal "${kamal_args[@]}" | grep --line-buffered -F "\"evt\":\"" | grep --line-buffered -F "$event" | "${pretty[@]}"
else
  kamal "${kamal_args[@]}" | "${pretty[@]}"
fi
