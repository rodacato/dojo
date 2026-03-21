# Spec 004 — Production Docker

**Expert:** Tomás Ríos
**Depends on:** Phase 3 (database — schema and migrations must exist)
**Can run in parallel with:** Phase 5 (security middleware)

## What and Why

The devcontainer handles local development. This phase adds production Docker artifacts: multi-stage Dockerfiles for API and web, an Nginx config for the web container, and a root-level `docker-compose.yml` for production deployment on the Hetzner VPS.

## Scope

**In:** `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/web/nginx.conf`, root `docker-compose.yml`
**Out:** Kamal deployment config (separate concern), CI Docker build (Phase 7), SSL termination (handled by Cloudflare Tunnel), environment-specific compose overrides

---

## `apps/api/Dockerfile`

Multi-stage. Final image contains only the compiled output and production dependencies.

```dockerfile
# Stage 1: base with pnpm
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Stage 2: install all dependencies (including dev — needed for build)
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# Stage 3: build
FROM deps AS builder
COPY tsconfig.base.json ./
COPY apps/api/ ./apps/api/
COPY packages/shared/ ./packages/shared/
RUN pnpm --filter=@dojo/shared build 2>/dev/null || true
RUN pnpm --filter=@dojo/api build

# Stage 4: production runtime (no source, no dev tools)
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/node_modules ./root_node_modules
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "dist/index.js"]
```

> `packages/shared` is built first because `@dojo/api` depends on it via `workspace:*`.

---

## `apps/web/Dockerfile`

Multi-stage. Final image is Nginx serving the Vite build — not `vite preview`.

```dockerfile
# Stage 1: build
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile
COPY tsconfig.base.json ./
COPY apps/web/ ./apps/web/
COPY packages/shared/ ./packages/shared/
RUN pnpm --filter=@dojo/web build

# Stage 2: serve with Nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost/health || exit 1
```

---

## `apps/web/nginx.conf`

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  # React Router — serve index.html for all unknown paths
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Proxy API requests to the api service (internal Docker DNS)
  location /api/ {
    proxy_pass http://api:3001/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  # WebSocket proxy for sensei streaming
  location /ws/ {
    proxy_pass http://api:3001/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 300s;  # allow long-running sensei evaluations
  }

  # Nginx health check endpoint (for Docker healthcheck)
  location /health {
    return 200 'ok';
    add_header Content-Type text/plain;
  }

  # Security headers
  add_header X-Frame-Options DENY;
  add_header X-Content-Type-Options nosniff;
  add_header Referrer-Policy strict-origin-when-cross-origin;

  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml;
}
```

---

## `docker-compose.yml` (root — production)

```yaml
services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: unless-stopped
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "3001:3001"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    restart: unless-stopped
    depends_on:
      - api
    ports:
      - "80:80"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-dojo}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-dojo}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-dojo}"]
      interval: 10s
      timeout: 5s
      retries: 5
    # No ports exposed — only api service can reach db via internal network

volumes:
  postgres-data:
```

**Key decisions:**
- `db` port NOT exposed. Only `api` reaches it via Docker internal DNS `db:5432`. Marta's requirement.
- `api` depends on `db` with `condition: service_healthy`. Prevents the API from starting before PostgreSQL is ready — eliminates the "connection refused" race condition on first boot.
- `POSTGRES_PASSWORD` has no default — it must be set in `.env`. Missing it causes compose to fail immediately (not silently).
- Nginx in `web` handles routing — `vite preview` is not production-hardened.

---

## `.env.example` additions

```
# Database (production)
POSTGRES_USER=dojo
POSTGRES_PASSWORD=change-me-strong-password
POSTGRES_DB=dojo
```

> `DATABASE_URL` should use these values: `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}`

---

## Acceptance Criteria

- [ ] `docker compose build` completes without error
- [ ] `docker compose up` starts all three services
- [ ] `curl http://localhost:3001/health` returns `{"status":"ok",...}`
- [ ] `curl http://localhost/health` returns `ok` (Nginx)
- [ ] `curl http://localhost/api/health` returns `{"status":"ok",...}` (proxied through Nginx)
- [ ] The `db` service is NOT accessible from outside Docker (no published port)
- [ ] Restarting the `api` container reconnects to `db` without manual intervention
- [ ] `docker compose down -v && docker compose up` runs migrations via the `post-install` hook (or manually via `docker compose exec api node -e "..."` — acceptable for Phase 0)

## Out of Scope

- Kamal deployment configuration (separate ADR when needed)
- Staging environment compose override
- Let's Encrypt / TLS termination (handled by Cloudflare Tunnel)
- Multi-replica API (single instance for Phase 0)
- Log aggregation, metrics, alerting (post-Phase 0)
