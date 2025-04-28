import { experimental_createMCPClient } from 'ai';

// Use 'any' or define a minimal interface if specific types aren't exported/found
type MCPClient = any; // Adjust if a more specific type is known/found
type MCPToolDefinition = any; // Adjust if a more specific type is known/found

// Define the structure for the SSE transport options, including potential headers
interface SseTransportOptions {
  type: 'sse';
  url: string;
  headers?: Record<string, string>;
}

const n8nUrl =
  process.env.N8N_MCP_SSE_URL ||
  'https://n8n-naps.onrender.com/mcp/a30284f9-3c68-4bc5-9d2c-b8a9c0c43ddc/sse';
// IMPORTANT: Store sensitive tokens securely, e.g., in environment variables.
// Avoid hardcoding them directly in the source code.
const n8nBearerToken = process.env.N8N_MCP_BEARER_TOKEN; // Ensure this env var is set

let n8nClient: MCPClient | null = null;

async function initializeN8nClient(): Promise<MCPClient | null> {
  // Return existing client if already initialized
  if (n8nClient) {
    return n8nClient;
  }

  if (!n8nBearerToken) {
    console.error(
      'N8N_MCP_BEARER_TOKEN environment variable is not set. Cannot initialize n8n MCP client.',
    );
    return null;
  }

  if (!n8nUrl) {
    console.error(
      'N8N_MCP_SSE_URL environment variable is not set. Cannot initialize n8n MCP client.',
    );
    return null;
  }

  try {
    console.log(`Initializing n8n MCP client for URL: ${n8nUrl}`);
    const transportOptions: SseTransportOptions = {
      type: 'sse',
      url: n8nUrl,
      headers: {
        Authorization: `Bearer ${n8nBearerToken}`,
      },
    };

    const client: MCPClient = await experimental_createMCPClient({
      transport: transportOptions,
    });
    console.log('n8n MCP client initialized successfully.');
    n8nClient = client;
    return n8nClient;
  } catch (error) {
    console.error('Failed to initialize n8n MCP client:', error);
    n8nClient = null; // Ensure client is null if initialization fails
    // Depending on requirements, you might want to throw the error
    // throw error;
    return null; // Or return null to indicate failure gracefully
  }
}

/**
 * Fetches tools from the configured n8n MCP server.
 * Initializes the client if necessary.
 * This function does NOT close the client, assuming it might be reused.
 * Call closeN8nClient() explicitly during application shutdown.
 */
export async function getN8nTools(): Promise<Record<
  string,
  MCPToolDefinition
> | null> {
  try {
    const client = await initializeN8nClient();
    if (!client) {
      console.log('n8n client not available, cannot fetch tools.');
      return null;
    }

    console.log('Fetching tools from n8n MCP server...');
    // Assume client.tools() returns the expected structure
    const tools: Record<string, MCPToolDefinition> = await client.tools();
    console.log(`Successfully fetched ${Object.keys(tools).length} n8n tools.`);
    return tools;
  } catch (error) {
    console.error('Failed to fetch tools from n8n MCP server:', error);
    return null;
  }
}

/**
 * Ensures the n8n MCP client is initialized.
 * Can be called at application startup.
 */
export async function ensureN8nClientInitialized(): Promise<void> {
  await initializeN8nClient();
}

/**
 * Closes the n8n MCP client if it's open.
 * Should be called on application shutdown to release resources.
 */
export async function closeN8nClient(): Promise<void> {
  if (n8nClient) {
    console.log('Closing n8n MCP client.');
    try {
      // Assume client.close() exists and returns a Promise
      await n8nClient.close();
      n8nClient = null;
      console.log('n8n MCP client closed successfully.');
    } catch (closeError) {
      console.error('Error closing n8n MCP client:', closeError);
      // Handle close error as needed
    }
  }
}
