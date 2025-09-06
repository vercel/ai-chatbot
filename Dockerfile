# Dockerfile
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Install PNPM globally as root
RUN npm install -g pnpm

# Copy package.json and lockfile for dependency caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy the rest of the app
COPY . .

# Expose port
EXPOSE 3000

# Start the dev server
CMD ["pnpm", "dev"]
