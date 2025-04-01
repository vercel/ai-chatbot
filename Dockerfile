# syntax=docker.io/docker/dockerfile:1

# Base image: Using Node.js 22 with Alpine Linux for a minimal footprint
FROM node:22-alpine AS base

# Stage 1: Dependencies
# This stage is responsible for installing all npm dependencies
FROM base AS deps
# Installing libc6-compat for Alpine Linux compatibility with certain Node.js packages
# Required for some npm packages that have native dependencies
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files and install dependencies using pnpm
# pnpm is used for faster and more efficient package management
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i;

# Stage 2: Building the application
# This stage builds the Next.js application
FROM base AS builder
WORKDIR /app
# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy all source files
COPY . .
# Copy environment variables for build configuration
COPY .env .env
# Build the Next.js application
RUN npm run build

# Stage 3: Production runtime
# Final stage that runs the application
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy only the necessary files for running the application
# Static files for serving
COPY --from=builder /app/public ./public

# Copy the standalone build output and static files
# Using Next.js output tracing to minimize the final image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user for security
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Configure the server
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the Next.js application
CMD ["node", "server.js"]
