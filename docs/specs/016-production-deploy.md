# Spec 016: Production Deploy

**Sprint:** 003
**Status:** ready

**Outcome:** The app is running in production on a Hetzner VPS behind Cloudflare Tunnel. The creator can log in, do a kata, and receive sensei feedback.

---

## Prerequisites

- [ ] GitHub OAuth App created for production (separate from dev)
- [ ] Anthropic API key with sufficient credits
- [ ] Hetzner account with billing set up
- [ ] Cloudflare account with the domain configured
- [ ] GHCR access (GitHub Container Registry — free with GitHub account)

---

## Step 1: Provision VPS (Hetzner)

1. Create a **CX22** server (2 vCPU, 4GB RAM — sufficient for Phase 0)
   - OS: Ubuntu 22.04
   - Location: closest to you (EU or US)
   - Add your SSH public key during creation
2. Note the VPS IP address

3. Initial server setup (run from local machine):
```bash
ssh root@<VPS_IP>
apt update && apt upgrade -y
apt install -y docker.io
systemctl enable --now docker
```

4. Create the Docker network Kamal expects:
```bash
docker network create dojo
```

---

## Step 2: Cloudflare Tunnel

1. In Cloudflare dashboard → Zero Trust → Tunnels → Create tunnel
2. Name: `dojo-prod`
3. Install connector on the VPS:
```bash
# On the VPS
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
  -o /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared
cloudflared tunnel login
cloudflared tunnel create dojo-prod
```
4. Configure the tunnel to route:
   - `dojo.notdefined.dev` → `http://dojo-web:80` (web container)
   - `dojo.notdefined.dev/api/*` → `http://dojo-api:3001` (API container)
5. Install as a systemd service:
```bash
cloudflared tunnel install
systemctl enable --now cloudflared
```

---

## Step 3: GitHub OAuth App (production)

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
   - Application name: `Dojo (prod)`
   - Homepage URL: `https://dojo.notdefined.dev`
   - Authorization callback URL: `https://dojo.notdefined.dev/api/auth/github/callback`
2. Note the Client ID and generate a Client Secret

---

## Step 4: Update Kamal config placeholders

In `config/deploy.api.yml` and `config/deploy.web.yml`, replace:
- `<GITHUB_USERNAME>` → your GitHub username
- `<VPS_IP>` → the VPS IP from Step 1

---

## Step 5: Configure GitHub Actions secrets

In the GitHub repo → Settings → Secrets and variables → Actions, add:

| Secret | Value |
|---|---|
| `SSH_PRIVATE_KEY` | Your SSH private key (matches the public key added to VPS) |
| `VPS_IP` | VPS IP address |
| `DATABASE_URL` | `postgresql://dojo:<POSTGRES_PASSWORD>@localhost:5432/dojo` |
| `POSTGRES_PASSWORD` | Strong random password |
| `SESSION_SECRET` | Strong random string (32+ chars) |
| `GITHUB_CLIENT_ID_PROD` | From Step 3 |
| `GITHUB_CLIENT_SECRET_PROD` | From Step 3 |
| `GITHUB_CALLBACK_URL` | `https://dojo.notdefined.dev/api/auth/github/callback` |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `CREATOR_GITHUB_ID` | Your GitHub numeric ID (find with `curl https://api.github.com/users/<username>`) |

Also set as an Actions variable (not secret):
- `WEB_URL` → `https://dojo.notdefined.dev`

---

## Step 6: First deploy

```bash
# From local machine, with Kamal installed (gem install kamal)
# Bootstrap the VPS (installs Docker, sets up registry auth)
kamal setup --config-file config/deploy.api.yml
kamal setup --config-file config/deploy.web.yml
```

Or push to `main` — the GitHub Actions workflow will run `kamal deploy` automatically.

The post-deploy hook runs:
1. `node dist/infrastructure/persistence/migrate.js` — applies DB migrations
2. `node dist/infrastructure/persistence/seed.js` — seeds 16 exercises (idempotent)

---

## Step 7: Self-test checklist

- [ ] `https://dojo.notdefined.dev` loads the landing page
- [ ] "Sign in" button → GitHub OAuth → redirects back → lands on `/dashboard`
- [ ] Dashboard shows streak 0, "Day 1. The dojo opens."
- [ ] `/start` → mood + duration → `/kata` → 3 exercise cards appear
- [ ] Select exercise → loads (preparing state visible) → kata body renders in markdown
- [ ] Write a response → submit → `/eval` → sensei streams evaluation
- [ ] Verdict appears → `/result` → "Return to dashboard" works
- [ ] Admin at `/admin` accessible with creator account

---

## Rollback

```bash
kamal rollback --config-file config/deploy.api.yml
kamal rollback --config-file config/deploy.web.yml
```

---

## WEB_URL env var

The API uses `config.WEB_URL` to redirect after OAuth. Verify `apps/api/src/config.ts` reads it from the environment and the GitHub Actions workflow sets it correctly.
