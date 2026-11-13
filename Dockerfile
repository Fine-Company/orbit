# syntax=docker/dockerfile:1

# Next.js 16 needs Node.js 20.9 or later. This matches the version used for local development.
ARG NODE_VERSION=26

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_UPDATE_NOTIFIER=false

# Dependencies, cached until package-lock.json changes.
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_OUTPUT turns on standalone output, see next.config.ts.
# @neon/auth throws at import if the cookie secret is missing or shorter than 32 characters,
# and `next build` imports it while collecting pages. The placeholder only gets past that check:
# this stage isn't part of the final image, and the container reads the real secret at runtime.
ENV NEXT_OUTPUT=standalone \
    NEON_AUTH_COOKIE_SECRET=build-time-placeholder-not-a-real-secret
# public/ is missing from a fresh clone while it's empty, and the runner stage copies it.
RUN mkdir -p public && npm run build

# One-off image that applies the migrations in drizzle/. Run it with `npm run docker:migrate`.
FROM deps AS migrate
COPY drizzle.config.ts ./
COPY drizzle ./drizzle
USER node
CMD ["npm", "run", "db:migrate"]

# The app: the standalone server and static assets, without the source or the full node_modules.
FROM base AS runner
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
# Checks only that the server responds. /api/health queries the database, and probing it
# every 30 seconds would stop Neon's compute from ever scaling to zero.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + process.env.PORT + '/favicon.ico').then((res) => process.exit(res.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "server.js"]
