# Deploying dojo

`master` is the only source of what gets deployed. `production` is a pointer that only moves by
fast-forward. GitHub Actions is the only place that holds production secrets, and `kamal deploy` is
the only thing that builds and publishes the production images (`:<sha>` and `:latest` on GHCR).

Two Kamal configs deploy in order: `config/deploy.api.yml` (the API plus the `db` and `piston`
accessories), then `config/deploy.web.yml`. Both run from [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml).

## Provision a host

1. An Ubuntu VPS with Docker, and a `deploy` user in the `docker` group that accepts the SSH key
   you will store as `SSH_PRIVATE_KEY`. Kamal connects as `deploy`.
2. Public traffic reaches kamal-proxy on the host's port 80 through a Cloudflare Tunnel, so the
   host exposes no HTTP ports ([ADR 011](../adr/011-cloudflare-tunnel-https.md)). Route both
   `APP_HOST` and `API_HOST` to `http://localhost:80`.
3. The runners open SSH to the host, so port 22 must be reachable from GitHub Actions. Keep it
   key-only.

## The `production` Environment

Settings → Environments → `production`. Every name below is read by the deploy workflow.

| Name | Kind | Required | What it is |
|---|---|---|---|
| `SSH_PRIVATE_KEY` | secret | yes | Private key for the host's `deploy` user |
| `HOST_IP` | secret | yes | Host address. A secret, not a variable: Kamal and `ssh-keyscan` print it, the logs of a public repo are public, and only secrets are masked |
| `APP_HOST` | var | yes | Web hostname without scheme: web's proxy host, the API's `WEB_URL`, the Open Graph URLs baked into the web build |
| `API_HOST` | var | yes | API hostname without scheme: the API's proxy host, the web build's `VITE_API_URL`, the CSP `connect-src`, the Piston execute smoke |
| `DATABASE_URL` | secret | yes | Points at the `db` accessory |
| `POSTGRES_PASSWORD` | secret | yes | Password of the `db` accessory |
| `SESSION_SECRET` | secret | yes | 32+ characters |
| `OAUTH_CLIENT_ID` | var | yes | GitHub OAuth app. Arrives in the container as `GITHUB_CLIENT_ID` |
| `OAUTH_CLIENT_SECRET` | secret | yes | Arrives as `GITHUB_CLIENT_SECRET` |
| `OAUTH_CALLBACK_URL` | var | yes | Arrives as `GITHUB_CALLBACK_URL` |
| `CREATOR_GITHUB_ID` | secret | no | Numeric GitHub id that unlocks `/admin` |
| `LLM_ADAPTER_FORMAT`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_STREAM` | var | no | Sensei endpoint |
| `LLM_API_KEY` | secret | no | Sensei endpoint key |
| `RESEND_API_KEY` | secret | no | Email delivery. Empty disables email entirely |
| `RESEND_FROM_EMAIL` | var | only with `RESEND_API_KEY` | Sender address on a domain verified in your Resend account, e.g. `dojo <noreply@your-domain.com>`. Also the inbox access requests are mailed to. With the key set and this empty the deploy stops before Kamal runs, and the API would refuse to boot |
| `CRON_SECRET` | secret | no | Bearer for `/cron/*`, also used by the Piston execute smoke |
| `PISTON_URL` | var | no | Piston accessory URL as the API sees it |
| `FF_CODE_EXECUTION_ENABLED`, `FF_COURSE_NUDGE_ENABLED`, `FF_LLM_PREP_STREAMING_ENABLED`, `FF_PLAYGROUND_ASK_SENSEI_ENABLED`, `FF_PLAYGROUND_CONSOLE_ENABLED` | var | no | Feature flags |
| `PLAYGROUND_ASK_SENSEI_DAILY_QUOTA` | var | no | Workflow falls back to `30` |
| `TURNSTILE_SITE_KEY` | var | no | Public Turnstile key (API and web build) |
| `TURNSTILE_SECRET_KEY` | secret | no | Turnstile verification |
| `SENTRY_DSN` | secret | no | API error tracking |
| `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE` | var | no | Workflow falls back to `production` and `0` |
| `VITE_SENTRY_DSN` | secret | no | Web error tracking |
| `VITE_SENTRY_ENVIRONMENT`, `SENTRY_ORG`, `SENTRY_PROJECT` | var | no | Web build; source maps upload only with `SENTRY_AUTH_TOKEN` |
| `SENTRY_AUTH_TOKEN` | secret | no | Source map upload during the web build |
| `METRICS_ENABLED` | var | no | See [Metrics](../../README.md#metrics-prometheus) |
| `METRICS_TOKEN` | secret | no | Bearer for `/metrics` |

GitHub refuses secret and variable names that start with `GITHUB_`, which is why the OAuth values
are stored as `OAUTH_*` and renamed in [`.kamal/secrets`](../../.kamal/secrets).

The workflow never sets `GITHUB_REPOSITORY_OWNER` or `GITHUB_ACTOR`: the configs read them from
the runner's default variables. `KAMAL_REGISTRY_PASSWORD` is the job's `GITHUB_TOKEN`.

Adding a secret to a config takes three edits in the same PR — `env.secret` in the config, a
`NAME=$NAME` line in `.kamal/secrets`, and the job's `env:` in the workflow — plus the value in the
Environment. A missing `.kamal/secrets` line or workflow entry reaches the container as an empty
string, silently.

## First deploy on a new host

Actions → **Deploy** → **Run workflow** from `master`, with `action` = `setup`. It installs
kamal-proxy, boots the accessories, and deploys both services.

Only as an emergency, the same can run from a machine with SSH access to the host, Kamal 2.12.0,
and every name above exported: `kamal setup -c config/deploy.api.yml`, then
`kamal setup -c config/deploy.web.yml`.

## Promote

```bash
git fetch origin && git push origin origin/master:production
```

Pushing `production` runs the deploy. Without `--force`, git rejects anything that is not a
fast-forward, and the deploy itself refuses a commit that is not on `master` (below).

**Run workflow** with `action` = `deploy` or `redeploy` from `master` deploys the current `master`
without moving the pointer.

Every job that runs Kamal first checks that the commit is on `master` and stops otherwise. A run
started from an unmerged branch fails there, before Kamal.

## Hotfix

No branch deploys directly. The fix goes through a PR to `master` like any change, then gets
promoted. To undo a bad release, revert on `master` and promote the revert.

## Accessories

`kamal deploy` does not recreate running accessories, so a change to an accessory's env, options
or image stays invisible until it is rebooted. The deploy reboots `piston` every time; for an
out-of-band reboot use Actions → **Reboot accessory**. `db` is never rebooted automatically.

Deploys and reboots share the `deploy` concurrency group, which never cancels a run in progress:
stopping `kamal deploy` halfway can leave Kamal's deploy lock held.

## Useful commands

With the environment of the next section, from any machine that can reach the host over SSH:

```bash
kamal config -c config/deploy.api.yml         # resolved config
kamal app details -c config/deploy.api.yml    # running containers, image, uptime
kamal app logs -f -c config/deploy.api.yml
kamal audit -c config/deploy.api.yml          # deploy history
kamal shell -c config/deploy.api.yml          # also: db, piston-shell, logs
```

## From the devcontainer

See [.devcontainer/README.md](../../.devcontainer/README.md).
