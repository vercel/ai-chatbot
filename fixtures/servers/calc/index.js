import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// pause a execution to streamed invocation state with 'call'
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const server = new McpServer({
  name: 'Calc',
  version: '1.0.0',
});

server.tool(
  'calc_add',
  'Add two of numbers',
  { a: z.number(), b: z.number() },
  async ({ a, b }) => {
    await sleep(100);

    return {
      content: [{ type: 'text', text: String(a + b) }],
    };
  },
);

server.tool(
  'calc_minus',
  'Subtract two of numbers',
  { a: z.number(), b: z.number() },
  async ({ a, b }) => {
    await sleep(100);

    return {
      content: [{ type: 'text', text: String(a - b) }],
    };
  },
);

server.tool(
  'calc_multiply',
  'Multiply two of numbers',
  { a: z.number(), b: z.number() },
  async ({ a, b }) => {
    await sleep(100);

    return {
      content: [{ type: 'text', text: String(a * b) }],
    };
  },
);

server.tool(
  'calc_divide',
  'Divide two of numbers',
  { a: z.number(), b: z.number() },
  async ({ a, b }) => {
    await sleep(100);

    return {
      content: [{ type: 'text', text: b === 0 ? 0 : String(a / b) }],
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
