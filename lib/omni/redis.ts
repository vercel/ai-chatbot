import { createClient } from "redis";

const url = process.env.REDIS_URL ?? "redis://localhost:6379";

export const redis = createClient({
  url,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 5000),
  },
});

redis.on("error", (err) => {
  console.error("Redis error", err);
});

void redis.connect();

const shutdown = async () => {
  try {
    await redis.quit();
  } catch {
    // noop
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
