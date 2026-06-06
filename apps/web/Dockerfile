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
ARG VITE_API_URL=https://dojo-api.notdefined.dev
ENV VITE_API_URL=$VITE_API_URL

# Sentry runtime config baked into the bundle.
ARG VITE_SENTRY_DSN=
ARG VITE_SENTRY_ENVIRONMENT=
ARG VITE_SENTRY_RELEASE=
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_SENTRY_ENVIRONMENT=$VITE_SENTRY_ENVIRONMENT
ENV VITE_SENTRY_RELEASE=$VITE_SENTRY_RELEASE

# Cloudflare Turnstile site key (public, baked into the bundle). Empty
# disables the widget — in prod that desyncs us from the API middleware
# and every run comes back 403 turnstile_required, so keep this ARG
# declared even if some envs leave it empty.
ARG VITE_TURNSTILE_SITE_KEY=
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY

# Source map upload (build-time only — @sentry/vite-plugin reads process.env).
# Skipped silently when any of the three is empty.
ARG SENTRY_AUTH_TOKEN=
ARG SENTRY_ORG=
ARG SENTRY_PROJECT=
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT
# Build @dojo/shared first so vite's production resolution of the
# "default" export condition (./dist/index.js) succeeds. Without this
# the build fails with 'Failed to resolve entry for package "@dojo/shared"'.
RUN pnpm --filter=@dojo/shared build
RUN pnpm --filter=@dojo/web build

# Stage 2: serve with Nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
