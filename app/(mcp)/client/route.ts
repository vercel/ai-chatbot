import { experimental_createMCPClient } from 'ai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const url = new URL('http://localhost:3000/mcp');

export async function GET() {
  const mcpClient = await experimental_createMCPClient({
    transport: new StreamableHTTPClientTransport(url, {
      sessionId: 'session_123',
    }),
  });

  console.log(mcpClient);

  const tools = await mcpClient.tools();

  return Response.json(tools);
}
