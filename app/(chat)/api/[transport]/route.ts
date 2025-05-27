import { createMcpHandler } from '@vercel/mcp-adapter';
import { z } from 'zod';

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'roll_dice',
      'Rolls an N-sided die',
      { sides: z.number().int().min(2) },
      async ({ sides }) => {
        const value = 1 + Math.floor(Math.random() * sides);
        return {
          content: [{ type: 'text', text: `🎲 You rolled a ${value}!` }],
        };
      },
    );
  },
  {},
  {
    basePath: '/api',
    verboseLogs: true,
  },
);

export { handler as POST };

export async function GET(request: Request) {
  const postRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: request.body,
  });

  return handler(postRequest);
}
