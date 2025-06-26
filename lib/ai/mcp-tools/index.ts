import { experimental_createMCPClient } from 'ai';

// Alternatively, you can connect to a Server-Sent Events (SSE) MCP server:
const clientTwo = await experimental_createMCPClient({
    transport: {
        type: 'sse',
        url: process.env.MCP_SERVER_URL!,
        headers: {
            'Authorization': `Bearer ${process.env.MCP_SERVER_TOKEN}`,
        },
    },
});
const toolSetTwo = await clientTwo.tools();

export const mcpTools = {
    ...toolSetTwo,
};