import { z } from 'zod';
import { createMcpHandler } from '@vercel/mcp-adapter';

const handler = createMcpHandler((server) => {
  server.tool(
    'roll_dice',
    'Rolls an N-sided die',
    { sides: z.number().int().min(2) },
    async ({ sides }) => {
      const value = 1 + Math.floor(Math.random() * sides);
      return { content: [{ type: 'text', text: `🎲 You rolled a ${value}!` }] };
    },
  );
});

export { handler as GET, handler as POST, handler as DELETE };
