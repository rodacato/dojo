# Operator runbook

What to do when running your own instance. Installing it is [GETTING_STARTED.md](../../GETTING_STARTED.md);
deploying with Kamal is [deploy.md](deploy.md); metrics and Piston recovery are
[observability.md](observability.md). Commands come in two forms: **Compose** (Path 2 of the getting
started guide) and **Kamal** (a server deployed per deploy.md). Names are the ones in
[docker-compose.yml](../../docker-compose.yml) and [config/deploy.api.yml](../../config/deploy.api.yml).

## Logs

| | Command |
|---|---|
| Compose | `docker compose logs -f dojo-api` |
| Kamal | `kamal app logs -f -c config/deploy.api.yml` |

LLM calls log `llm.request`, `llm.response` and `llm.error` as JSON lines, with the status of a failed call.

## Upgrade

Back up first ([below](#back-up-and-restore-postgres)). The API applies migrations on every boot, so
there is no separate migrate step.

| | Command |
|---|---|
| Compose | `git pull && docker compose up --build -d` |
| Kamal | promote `master` to `production`, see [deploy.md](deploy.md#promote) |

New katas are not loaded by an upgrade. After one that adds katas, rerun the seed from
[GETTING_STARTED.md](../../GETTING_STARTED.md) (idempotent). A Kamal deploy runs it for you
([.kamal/hooks/post-deploy](../../.kamal/hooks/post-deploy)).

## Roll back

Reverting the code does not revert the database: migrations only go forward, and there are no down
migrations. If the release you are leaving behind added one, the old code runs against the new schema,
which may or may not work. The reliable way back is the backup taken before the upgrade, restored
into an empty database.

Kamal: revert on `master` and promote the revert ([deploy.md](deploy.md#hotfix)). Compose:
`git checkout <previous tag>` and `docker compose up --build -d`.

## Back up and restore Postgres

Nothing backs the database up for you. The kata history and every user's progress live only there.

```bash
# Compose (user and database `dojo` are the defaults; use your POSTGRES_USER and POSTGRES_DB if you changed them)
docker compose exec -T db pg_dump -U dojo dojo | gzip > dojo-$(date +%F).sql.gz

# Kamal: on the host, the db accessory (container name per `docker ps`, normally dojo-api-db)
docker exec dojo-api-db pg_dump -U dojo dojo | gzip > dojo-$(date +%F).sql.gz
```

Restore into an empty database, with the API stopped:

```bash
# Compose
gunzip -c dojo-2026-01-01.sql.gz | docker compose exec -T db psql -U dojo dojo

# Kamal, on the host
gunzip -c dojo-2026-01-01.sql.gz | docker exec -i dojo-api-db psql -U dojo dojo
```

Copy the dump off the machine, and restore one into a scratch database before you need it. A backup
you have never restored is a guess. These commands were not run against a live instance when this
page was written.

## Rotate a secret

Rotate immediately if one leaks. Compose: edit `.env`, then `docker compose up -d`. Kamal: update the
secret in the GitHub Environment, then run the Deploy workflow ([deploy.md](deploy.md)).

| Secret | What happens when it changes |
|---|---|
| `SESSION_SECRET` | Used to hash anonymous playground session ids for rate-limit buckets and quota counting. Rotating it resets those counters. Signed-in sessions are database rows and stay valid |
| `GITHUB_CLIENT_SECRET` | Generate a new one on the GitHub OAuth app first. Sign-in fails between the old one being revoked and the deploy finishing |
| `LLM_API_KEY` | Evaluations fail until the new key is deployed |
| `CRON_SECRET`, `METRICS_TOKEN` | Whatever calls `/cron/*` or scrapes `/metrics` has to be updated at the same time |
| `POSTGRES_PASSWORD` | Changing the variable does not change an existing database. Run `ALTER USER dojo PASSWORD '<new>'` in Postgres first, then update `POSTGRES_PASSWORD` and the password inside `DATABASE_URL` together. `db` is never rebooted automatically |

To end every signed-in session at once, delete the rows in `user_sessions`.

## The LLM endpoint is down

What users see:

- A sensei evaluation that fails mid-stream ends with an `LLM_STREAM_ERROR` and the attempt is saved
  as incomplete.
- Preparing a kata fails and its session is discarded, so they can start again once it is back.

Where to look: the `llm.error` lines in the API log carry the HTTP status. `/admin/health` only says
whether `LLM_API_KEY` is set, not whether the endpoint answers, so it stays green during an outage.

Do not switch `LLM_ADAPTER_FORMAT` to `mock` to keep the instance "up": it returns canned verdicts
that look real. Running the sensei on your own subscription through SheLLM has its own failure modes,
see [shellm.md](shellm.md).
