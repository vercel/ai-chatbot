# Use Node.js 18 slim image as base
FROM node:18-slim

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files for Node.js dependencies
COPY package.json pnpm-lock.yaml ./

# Install Node.js dependencies
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the Next.js application (without database migrations)
RUN pnpm run build

# Start script that optionally runs migrations
CMD ["sh", "-c", "if [ -n \"$POSTGRES_URL\" ]; then pnpm run db:migrate; fi && pnpm start"] 