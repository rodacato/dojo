# Getting Started

Run dojo locally. For what dojo *is*, see [docs/VISION.md](docs/VISION.md); for how it's
built, [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

The API runs database migrations automatically on every boot — no manual migrate step is
required for the app to start. The LLM (sensei) defaults to `mock`, so no API key is needed
to run. The one thing you must set up for any path is GitHub sign-in (see below).

## Prerequisites

- **Docker + Docker Compose** (for the container paths), or
- **Node.js ≥ 24** + **pnpm ≥ 9** (for the bare-metal path)
- A **GitHub OAuth app** to sign in — see [Sign-in setup](#sign-in-setup)

## Path 1 — Dev with hot reload (recommended: Dev Container)

Best for contributing. Works in VS Code or GitHub Codespaces.

1. Clone, open the folder in VS Code, and run **Dev Containers: Reopen in Container**.
2. `.devcontainer/post-install.sh` runs automatically: installs deps, waits for Postgres,
   creates `.env`, runs migrations, seeds the public scroll catalog, and provisions Piston.
3. Fill in the GitHub OAuth values in `.env` (see [Sign-in setup](#sign-in-setup)).
4. Start the dev servers:
   ```bash
   pnpm dev
   ```

Web → `http://localhost:5173` · API → `http://localhost:3001`. Code execution (Piston) is
enabled automatically in the container.

## Path 2 — A full instance (Docker only, no VS Code)

Best for self-hosting or a quick look. Builds production images and runs the whole stack.

```bash
git clone https://github.com/rodacato/dojo
cd dojo
cp .env.example .env
# edit .env → set the GitHub OAuth values (see "Sign-in setup")
docker compose up --build
```

Web → `http://localhost` (port 80) · API → `http://localhost:3001`. Migrations run on boot.
The public scroll catalog is **not** seeded on this path (the production image has no seed
tooling) — create content via `/admin`, or use Path 1 to seed a shared database.

## Path 3 — Bare metal (advanced)

Requires your own PostgreSQL 16 reachable on `localhost`.

```bash
cp .env.example .env
# edit .env → DATABASE_URL=postgresql://<user>:<pass>@localhost:5432/dojo_dev
#             plus the GitHub OAuth values (see "Sign-in setup")
createdb dojo_dev                          # or create it with your own PG tooling
pnpm install
pnpm --filter=@dojo/api db:migrate         # create the schema so the seed has tables
pnpm --filter=@dojo/api db:seed:scrolls    # optional: seed the public scroll catalog
pnpm dev
```

Web → `http://localhost:5173` · API → `http://localhost:3001`.

> The default `DATABASE_URL` points to `db:5432` — a hostname that only resolves inside the
> Docker network. On bare metal you must override it to `localhost`.

## Sign-in setup

dojo signs you in with GitHub OAuth; there is no anonymous login. Create an app at
[github.com/settings/applications/new](https://github.com/settings/applications/new):

- **Homepage URL:** `http://localhost:5173` (Paths 1 & 3) or `http://localhost` (Path 2)
- **Authorization callback URL:** `http://localhost:3001/auth/github/callback`

Then set in `.env`:

| Variable | Value |
|---|---|
| `GITHUB_CLIENT_ID` | the app's Client ID |
| `GITHUB_CLIENT_SECRET` | a generated client secret |
| `CREATOR_GITHUB_ID` | your GitHub **numeric** id (unlocks `/admin`) — find it at `https://api.github.com/users/<your-username>` |

## First-run check

1. API log shows migrations applied, then `dojo_ api running on port 3001`.
2. Open the web URL and sign in with GitHub.
3. `/admin` is reachable if `CREATOR_GITHUB_ID` matches your account.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `database "dojo_dev" does not exist` | `POSTGRES_DB` must match the database in `DATABASE_URL`. |
| API can't reach the DB on `pnpm dev` | `DATABASE_URL` uses `db:5432` (Docker-only DNS). On bare metal, point it at `localhost`. |
| Sign-in fails / redirect error | The OAuth app's callback URL must be exactly `http://localhost:3001/auth/github/callback`. |
| Code kata return mocked results | `FF_CODE_EXECUTION_ENABLED=false` (the default). Path 1 enables it automatically; otherwise set it to `true` with Piston running. |

## More

[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/WORKFLOW.md](docs/WORKFLOW.md) ·
[CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md) (self-hosting notes)
