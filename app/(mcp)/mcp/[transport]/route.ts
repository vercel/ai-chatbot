import { createMcpHandler } from '@vercel/mcp-adapter';
import { z } from 'zod';

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'getWeather',
      'Get the current weather at a location',
      { latitude: z.number(), longitude: z.number() },
      async ({ latitude, longitude }) => {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
        );

        return await response.json();
      },
    );
  },
  {
    capabilities: {
      tools: {
        echo: {
          description: 'Echo a message',
        },
      },
    },
  },
  {
    redisUrl: process.env.REDIS_URL,
    basePath: '/mcp',
    verboseLogs: false,
    maxDuration: 60,
  },
);

export { handler as GET, handler as POST, handler as DELETE };
