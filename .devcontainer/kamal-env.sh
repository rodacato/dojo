# Non-secret environment Kamal needs to render config/deploy.*.yml locally.
# Real secrets never live here: a deploy runs in GitHub Actions, which injects
# them from the "production" GitHub Environment.

: "${DOJO_ROOT:=$(git rev-parse --show-toplevel 2>/dev/null)}"
[ -n "${DOJO_ROOT:-}" ] || return 0 2>/dev/null || exit 0

if [ -z "${GITHUB_USERNAME:-}" ]; then
  _kamal_owner="$(git -C "$DOJO_ROOT" config --get remote.origin.url 2>/dev/null |
    sed -E 's#^(git@[^:]+:|https?://[^/]+/)##; s#\.git$##; s#/.*$##')"
  [ -n "$_kamal_owner" ] && export GITHUB_USERNAME="$_kamal_owner"
  unset _kamal_owner
fi

if [ -r "$DOJO_ROOT/.devcontainer/local.env" ]; then
  set -a
  . "$DOJO_ROOT/.devcontainer/local.env"
  set +a
fi
