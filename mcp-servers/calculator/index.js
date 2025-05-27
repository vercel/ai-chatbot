import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { calc } from 'a-calc';

// pause a execution to streamed invocation state with 'call'
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const server = new McpServer({
  name: 'Calculator',
  version: '1.0.0',
});

server.tool(
  'calculator',
  'Calculate numbers for addition, subtraction, division, multiplication, and more if text has numbers and operation, return the result',
  { formula: z.string() },
  async ({ formula }) => {
    const content = [];

    try {
      await sleep(100);

      content.push({
        type: 'text',
        text: calc(formula),
      });
    } catch {
      content.push({
        type: 'text',
        text: 'Error: Invalid formula',
      });
    }

    return {
      content,
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
