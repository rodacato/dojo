# Spec 016: Production Deploy

**Sprint:** 003
**Status:** ready

**Outcome:** The app is running in production on a Hetzner VPS. The creator can log in, do a kata, and receive sensei feedback.

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
2. Note the VPS IP address (`HOST_IP`)

3. Create a `deploy` user with SSH access (Kamal deploys as this user, not root):
```bash
ssh root@<HOST_IP>
adduser deploy
usermod -aG sudo,docker deploy
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

4. Install Docker:
```bash
apt update && apt upgrade -y
apt install -y docker.io
systemctl enable --now docker
```

---

## Step 2: Cloudflare Tunnel

Kamal proxy handles HTTP routing on the VPS (port 80). Cloudflare Tunnel sends traffic from the internet to the VPS without opening ports publicly.

1. In Cloudflare dashboard → Zero Trust → Tunnels → Create tunnel
2. Name: `dojo-prod`
3. Install connector on the VPS as the `deploy` user:
```bash
ssh deploy@<HOST_IP>
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
  -o /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared
cloudflared tunnel login
cloudflared tunnel create dojo-prod
```
4. Configure the tunnel to route:
   - `dojo.notdefined.dev` → `http://localhost:80` (Kamal proxy handles routing from there)
5. Install as a systemd service:
```bash
cloudflared service install
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

## Step 4: GitHub Actions environment

In the GitHub repo → Settings → Environments → New environment → `production`

Add the following secrets to the `production` environment:

| Secret | Value |
|---|---|
| `SSH_PRIVATE_KEY` | SSH private key that matches the public key on the VPS `deploy` user |
| `HOST_IP` | VPS IP address |
| `DATABASE_URL` | `postgresql://dojo:<POSTGRES_PASSWORD>@localhost:5432/dojo` |
| `POSTGRES_PASSWORD` | Strong random password — `openssl rand -hex 16` |
| `SESSION_SECRET` | Random string 32+ chars — `openssl rand -hex 32` |
| `OAUTH_CLIENT_ID` | OAuth App Client ID from Step 3 |
| `OAUTH_CLIENT_SECRET` | OAuth App Client Secret from Step 3 |
| `OAUTH_CALLBACK_URL` | `https://dojo-api.notdefined.dev/auth/github/callback` |
| `LLM_API_KEY` | Your Anthropic API key |
| `CREATOR_GITHUB_ID` | Your GitHub numeric ID — `curl https://api.github.com/users/<username> \| jq .id` |

Not needed as secrets (set automatically by the workflow):
- `KAMAL_REGISTRY_PASSWORD` ← `secrets.GITHUB_TOKEN` (free, auto-provided)
- `GITHUB_USERNAME` ← `github.repository_owner` (auto-provided)

---

## Step 5: First deploy

Push to `main` — the GitHub Actions workflow runs automatically:

1. **build-api** and **build-web** run in parallel — build and push Docker images to GHCR
2. **deploy-api** runs — detects first run (`kamal app details` fails) → `kamal setup` bootstraps the VPS (installs kamal-proxy, starts postgres accessory, deploys API)
3. **deploy-web** runs after API — same setup-or-deploy logic

The post-deploy hook runs automatically:
1. `node dist/infrastructure/persistence/migrate.js` — applies DB migrations
2. `node dist/infrastructure/persistence/seed.js` — seeds 16 exercises (idempotent)

Subsequent pushes to `main` run `kamal deploy` (rolling update, no accessory restart).

---

## Step 6: Self-test checklist

- [ ] `https://dojo.notdefined.dev` loads the landing page
- [ ] "Sign in" → GitHub OAuth → lands on `/dashboard`
- [ ] Dashboard shows "Day 1. The dojo opens."
- [ ] `/start` → `/kata` → 3 exercise cards appear
- [ ] Select exercise → preparing state → kata body renders in markdown
- [ ] Write a response → submit → `/eval` → sensei streams evaluation
- [ ] Verdict appears → `/result` → "Return to dashboard" works
- [ ] Admin at `/admin` accessible with creator account

---

## Rollback

```bash
# From local, with Kamal installed and SSH access
kamal rollback --config-file config/deploy.api.yml
kamal rollback --config-file config/deploy.web.yml
```

Or revert the commit on `main` and push — the workflow redeploys the previous image.
