# Spec 015: Kamal Deploy

> **Status:** superseded — see `docs/specs/016-production-deploy.md` for the current deploy guide (updated config with ERB env vars, Kamal 2 proxy, gha cache, deploy user)
> **Depends on:** Full local loop working end-to-end (spec 009–014 implemented)
> **Priority:** Last — do not start until you can complete a kata locally

---

## What this spec covers

Production deployment to a Hetzner VPS using Kamal v2. Cloudflare Tunnel for HTTPS termination. GitHub Actions for CI/CD.

Architecture:
```
Internet → Cloudflare Tunnel → VPS (Kamal manages Docker containers)
                                  ├── api container (port 3001)
                                  ├── web container (port 80)
                                  └── postgres container (internal only)
```

---

## 1. Prerequisites

Before running `kamal setup` for the first time:

- [ ] Hetzner VPS provisioned: Ubuntu 24.04, minimum 2 vCPU / 4 GB RAM
- [ ] SSH key added to VPS (`~/.ssh/authorized_keys`)
- [ ] Docker not pre-installed on VPS — Kamal installs it
- [ ] Cloudflare account with `dojo.notdefined.dev` domain
- [ ] Cloudflare Tunnel created (`cloudflared tunnel create dojo`)
- [ ] GitHub Container Registry (`ghcr.io`) access token with `write:packages` scope

---

## 2. Install Kamal

```bash
# On the deployment machine (local or CI)
gem install kamal -v 2.x
```

Or use the Docker-based approach — Kamal can run in a container.

---

## 3. `config/deploy.yml`

Create at the root of the monorepo. Kamal v2 config.

```yaml
# config/deploy.yml

service: dojo
image: ghcr.io/<GITHUB_USERNAME>/dojo

# SSH connection to the VPS
servers:
  web:
    hosts:
      - <VPS_IP>
    labels:
      traefik.http.routers.dojo.rule: Host(`dojo.notdefined.dev`)

# Container registry
registry:
  server: ghcr.io
  username: <GITHUB_USERNAME>
  password:
    - KAMAL_REGISTRY_PASSWORD   # GitHub PAT with write:packages

# Environment variables injected at deploy time
# Secrets referenced here are passed via `kamal env push`
env:
  clear:
    NODE_ENV: production
    PORT: "3001"
    LLM_ADAPTER: anthropic
    SESSION_DURATION_DAYS: "30"
  secret:
    - DATABASE_URL
    - SESSION_SECRET
    - GITHUB_CLIENT_ID
    - GITHUB_CLIENT_SECRET
    - GITHUB_CALLBACK_URL
    - ANTHROPIC_API_KEY
    - CREATOR_GITHUB_ID

# Two services: api (Hono) and web (Nginx)
accessories:
  db:
    image: postgres:16-alpine
    host: <VPS_IP>
    env:
      clear:
        POSTGRES_DB: dojo
        POSTGRES_USER: dojo
      secret:
        - POSTGRES_PASSWORD
    volumes:
      - dojo_postgres:/var/lib/postgresql/data
    options:
      restart: unless-stopped

# Health checks
healthcheck:
  path: /health
  port: 3001
  max_attempts: 10
  interval: 3s

# Build configuration
builder:
  multiarch: false    # VPS is x86_64
  dockerfile: apps/api/Dockerfile
  context: .
  cache:
    type: registry
    options: mode=max

# Run DB migrations after deploy, before traffic switches
hooks:
  post-deploy: kamal app exec --reuse 'node dist/infrastructure/persistence/migrate.js'
```

---

## 4. Multi-service Kamal config

Kamal v2 supports multiple images per deploy. We need separate images for `api` and `web`.

Create two config files:

```
config/
  deploy.api.yml    ← API service
  deploy.web.yml    ← Web/Nginx service
```

### `config/deploy.api.yml`

```yaml
service: dojo-api
image: ghcr.io/<GITHUB_USERNAME>/dojo-api

servers:
  web:
    hosts:
      - <VPS_IP>
    options:
      network: dojo

registry:
  server: ghcr.io
  username: <GITHUB_USERNAME>
  password:
    - KAMAL_REGISTRY_PASSWORD

env:
  clear:
    NODE_ENV: production
    PORT: "3001"
    LLM_ADAPTER: anthropic
  secret:
    - DATABASE_URL
    - SESSION_SECRET
    - GITHUB_CLIENT_ID
    - GITHUB_CLIENT_SECRET
    - GITHUB_CALLBACK_URL
    - ANTHROPIC_API_KEY
    - CREATOR_GITHUB_ID

healthcheck:
  path: /health
  port: 3001

builder:
  dockerfile: apps/api/Dockerfile
  context: .
  cache:
    type: registry

# Run seed after first deploy
hooks:
  post-deploy: kamal app exec --reuse 'node -e "import(\"./dist/infrastructure/persistence/seed.js\").then(m=>m.seed())"'
```

### `config/deploy.web.yml`

```yaml
service: dojo-web
image: ghcr.io/<GITHUB_USERNAME>/dojo-web

servers:
  web:
    hosts:
      - <VPS_IP>
    options:
      network: dojo

registry:
  server: ghcr.io
  username: <GITHUB_USERNAME>
  password:
    - KAMAL_REGISTRY_PASSWORD

env:
  clear:
    NGINX_PORT: "80"

healthcheck:
  path: /health
  port: 80

builder:
  dockerfile: apps/web/Dockerfile
  context: .
```

---

## 5. Docker network

Both containers must reach each other. Create a shared Docker network on the VPS:

```bash
docker network create dojo
```

The web container's Nginx proxies `/api` and `/ws` to `dojo-api:3001` (by container name in the shared network).

---

## 6. Nginx config update (`apps/web/nginx.conf`)

Ensure the container name is used for upstream, not `localhost`:

```nginx
upstream api {
  server dojo-api:3001;
}

server {
  listen 80;

  location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  location /ws/ {
    proxy_pass http://api/ws/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
  }

  location /health {
    return 200 'ok';
    add_header Content-Type text/plain;
  }
}
```

---

## 7. Cloudflare Tunnel

Cloudflare Tunnel routes `dojo.notdefined.dev` → VPS port 80 (Nginx) without exposing SSH/ports directly.

### Setup steps

```bash
# On VPS
curl -L --output cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared
mv cloudflared /usr/local/bin/

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create dojo

# Configure
cat > /etc/cloudflared/config.yml << EOF
tunnel: <TUNNEL_UUID>
credentials-file: /root/.cloudflared/<TUNNEL_UUID>.json

ingress:
  - hostname: dojo.notdefined.dev
    service: http://localhost:80
  - service: http_status:404
EOF

# Install as systemd service
cloudflared service install

# Add DNS record (run once)
cloudflared tunnel route dns dojo dojo.notdefined.dev
```

### Environment secret needed

The tunnel UUID and credentials are not in the Kamal secrets — they live on the VPS directly. Do not version-control `.cloudflared/` files.

---

## 8. GitHub Actions CI/CD workflow

### `.github/workflows/deploy.yml`

```yaml
name: Deploy to production

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Set up Ruby (for Kamal)
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.3'

      - name: Install Kamal
        run: gem install kamal -v '~> 2.0'

      - name: Set up SSH
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Add VPS to known hosts
        run: |
          ssh-keyscan -H ${{ secrets.VPS_IP }} >> ~/.ssh/known_hosts

      - name: Deploy API
        env:
          KAMAL_REGISTRY_PASSWORD: ${{ secrets.GITHUB_TOKEN }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          SESSION_SECRET: ${{ secrets.SESSION_SECRET }}
          GITHUB_CLIENT_ID: ${{ secrets.GITHUB_CLIENT_ID_PROD }}
          GITHUB_CLIENT_SECRET: ${{ secrets.GITHUB_CLIENT_SECRET_PROD }}
          GITHUB_CALLBACK_URL: ${{ secrets.GITHUB_CALLBACK_URL }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          CREATOR_GITHUB_ID: ${{ secrets.CREATOR_GITHUB_ID }}
          POSTGRES_PASSWORD: ${{ secrets.POSTGRES_PASSWORD }}
        run: kamal deploy --config-file config/deploy.api.yml

      - name: Deploy Web
        env:
          KAMAL_REGISTRY_PASSWORD: ${{ secrets.GITHUB_TOKEN }}
        run: kamal deploy --config-file config/deploy.web.yml
```

---

## 9. GitHub Environment `production` secrets

Set these in the GitHub repo under **Settings → Environments → production**:

| Secret | Value |
|---|---|
| `SSH_PRIVATE_KEY` | Private key matching the public key on the VPS |
| `VPS_IP` | Hetzner VPS IPv4 |
| `DATABASE_URL` | `postgresql://dojo:<PASSWORD>@localhost:5432/dojo` |
| `POSTGRES_PASSWORD` | Strong password, 32+ chars |
| `SESSION_SECRET` | Random 64-char hex string |
| `GITHUB_CLIENT_ID_PROD` | GitHub OAuth app client ID (production callback URL) |
| `GITHUB_CLIENT_SECRET_PROD` | GitHub OAuth app client secret |
| `GITHUB_CALLBACK_URL` | `https://dojo.notdefined.dev/auth/github/callback` |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `CREATOR_GITHUB_ID` | Your GitHub username |

**Note on naming:** `GITHUB_CLIENT_ID_PROD` and `GITHUB_CLIENT_SECRET_PROD` use `_PROD` suffix to avoid collision with the built-in `GITHUB_TOKEN` and similar reserved names in GitHub Actions.

---

## 10. First deploy checklist

Run these in order on first deploy:

```bash
# 1. Push secrets to VPS
kamal env push --config-file config/deploy.api.yml

# 2. Provision VPS (installs Docker, creates network)
kamal server bootstrap --config-file config/deploy.api.yml

# 3. Start the database accessory
kamal accessory boot db --config-file config/deploy.api.yml

# 4. Run DB migrations (creates tables)
kamal app exec --config-file config/deploy.api.yml 'node dist/infrastructure/persistence/migrate.js'

# 5. Run seed data
kamal app exec --config-file config/deploy.api.yml 'node -e "import(\"./dist/infrastructure/persistence/seed.js\").then(m=>m.seed())"'

# 6. Deploy API
kamal deploy --config-file config/deploy.api.yml

# 7. Deploy Web
kamal deploy --config-file config/deploy.web.yml

# 8. Verify health
curl https://dojo.notdefined.dev/api/health
```

---

## 11. Migration script

The API needs a `migrate.js` entrypoint for running Drizzle migrations in production. Add to `apps/api/package.json`:

```json
{
  "scripts": {
    "db:migrate": "drizzle-kit migrate",
    "db:migrate:prod": "node dist/infrastructure/persistence/migrate.js"
  }
}
```

Create `apps/api/src/infrastructure/persistence/migrate.ts`:

```typescript
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db } from './drizzle/client'
import { join } from 'path'

await migrate(db, {
  migrationsFolder: join(import.meta.dirname, '../../../../drizzle'),
})

console.log('Migrations complete.')
process.exit(0)
```

The build output includes this file as `dist/infrastructure/persistence/migrate.js`.

---

## 12. Zero-downtime deploy

Kamal v2 handles zero-downtime by default:
1. Builds and pushes new image
2. Starts new container
3. Waits for health check to pass
4. Switches traffic to new container
5. Stops old container

No additional configuration needed beyond the `healthcheck` in `deploy.api.yml`.

---

## 13. Rollback

```bash
# Roll back to previous version
kamal rollback --config-file config/deploy.api.yml
kamal rollback --config-file config/deploy.web.yml
```

Kamal keeps the previous image available until the next deploy overwrites it.

---

## 14. Test matrix

| Test | What to verify |
|---|---|
| `kamal deploy` — first run | Containers start, health check passes |
| `GET https://dojo.notdefined.dev/api/health` | Returns 200 |
| `GET https://dojo.notdefined.dev` | Serves React app (index.html) |
| GitHub OAuth login | Callback URL matches production OAuth app |
| WebSocket connection | `wss://dojo.notdefined.dev/ws/sessions/:id` connects |
| DB seed | 8 exercises visible in admin UI |
| CI deploy | Push to `main` triggers deploy workflow successfully |
| Rollback | Previous version restores after `kamal rollback` |

---

## 15. Known issues and mitigations

| Issue | Mitigation |
|---|---|
| Cold start: first deploy seed runs twice | `seed()` is idempotent — safe |
| WebSocket disconnect on deploy | 60-second reconnect window (spec 010) handles in-flight evaluations |
| Cloudflare Tunnel must run before Kamal | Start `cloudflared` service before first deploy |
| GitHub OAuth app needs production URL | Create a separate OAuth app for production vs. local dev |
