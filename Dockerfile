# Multi-stage Dockerfile for Next.js + pnpm (Container Apps via azd)
# Uses pnpm (enabled via corepack) to stay consistent with local dev.
# NOTE: If database migrations should run at runtime instead of build time,
# adjust the build script (see comments below).

ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-bookworm-slim AS base
# Keep build environment generic (no NODE_ENV=production) so devDependencies install naturally.
ENV PNPM_HOME=/pnpm \
  NEXT_TELEMETRY_DISABLED=1
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app
RUN corepack enable

# ---------- Dependencies layer (only lockfile + manifest) ----------
FROM base AS deps
# Copy only the manifests to leverage Docker layer caching
COPY package.json pnpm-lock.yaml ./
# Install all dependencies (dev + prod). Next.js build needs Tailwind, TypeScript, etc.
RUN pnpm install --frozen-lockfile

# ---------- Build layer ----------
FROM deps AS build
# Copy the rest of the source
COPY . .
RUN pnpm run build
# Prune dev dependencies after build for a slimmer runtime (keep only prod dependencies)
RUN pnpm prune --prod

# ---------- Runtime layer ----------
FROM node:${NODE_VERSION}-bookworm-slim AS runner
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  PORT=80
WORKDIR /app
# No extra system packages needed for runtime
# Copy only what we need from build stage
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-lock.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
# If using next.config.js / instrumentation.ts / middleware.ts ensure they are copied if needed at runtime
COPY --from=build /app/next.config.* ./
# Copy optional middleware / instrumentation if present
COPY --from=build /app/middleware.ts ./middleware.ts
COPY --from=build /app/instrumentation.ts ./instrumentation.ts

EXPOSE 80
# Use Next.js start directly (avoid relying on shell)
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "80"]
