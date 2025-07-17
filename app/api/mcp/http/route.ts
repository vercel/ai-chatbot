import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import { withAuth } from '@workos-inc/authkit-nextjs';

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'echo',
      'Echo back the input text',
      {
        text: z.string().describe('The text to echo back'),
      },
      async ({ text }) => {
        // Get user info from WorkOS session
        const { user } = await withAuth();
        
        return {
          content: [
            {
              type: 'text',
              text: `Echo: ${text} (authenticated as ${user?.firstName || user?.email || 'unknown'})`,
            },
          ],
        };
      }
    );
  },
  {},
  {
    basePath: '/api',
  }
);

export { handler as GET, handler as POST };