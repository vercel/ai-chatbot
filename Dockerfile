# Use the official Node.js image as base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]