import { createMCPClient } from "@ai-sdk/mcp";
import type { MCPConfig, MCPServerConfig } from "./types";

export class MCPClientManager {
  private clients: Map<
    string,
    Awaited<ReturnType<typeof createMCPClient>>
  > = new Map();
  private config: MCPConfig;
  private inputValues: Map<string, string> = new Map();

  constructor(config: MCPConfig) {
    this.config = config;
  }

  /**
   * Set input values for environment variable substitution
   */
  setInputValue(inputId: string, value: string): void {
    this.inputValues.set(inputId, value);
  }

  /**
   * Substitute ${input:id} patterns in environment variables
   */
  private substituteEnvVars(
    env: Record<string, string> | undefined
  ): Record<string, string> {
    if (!env) return {};

    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(env)) {
      const match = value.match(/^\$\{input:(.+)\}$/);
      if (match) {
        const inputId = match[1];
        const inputValue = this.inputValues.get(inputId);
        if (!inputValue) {
          throw new Error(
            `Missing input value for '${inputId}'. Call setInputValue() first.`
          );
        }
        result[key] = inputValue;
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Connect to an MCP server by name
   * Note: Current beta version only supports HTTP/SSE transports.
   * stdio support will be available in stable AI SDK 6 release.
   */
  async connect(serverName: string): Promise<void> {
    if (this.clients.has(serverName)) {
      return; // Already connected
    }

    const serverConfig = this.config.servers[serverName];
    if (!serverConfig) {
      throw new Error(`MCP server '${serverName}' not found in configuration`);
    }

    if (serverConfig.type === "stdio") {
      throw new Error(
        `stdio transport not yet supported in beta version. Use HTTP or SSE transport, or wait for AI SDK 6 stable release with full stdio support.`
      );
    }

    const env = this.substituteEnvVars(serverConfig.env);

    const client = await createMCPClient({
      transport: {
        type: serverConfig.type as "http" | "sse",
        url: (serverConfig as any).url || "",
        headers: env,
      },
    });

    this.clients.set(serverName, client);
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnect(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    if (client) {
      await client.close();
      this.clients.delete(serverName);
    }
  }

  /**
   * Get all tools from all connected servers
   */
  async getAllTools(): Promise<Record<string, any>> {
    const allTools: Record<string, any> = {};

    for (const [serverName, client] of this.clients.entries()) {
      const tools = await client.tools();
      // Prefix tool names with server name to avoid conflicts
      for (const [toolName, tool] of Object.entries(tools)) {
        allTools[`${serverName}:${toolName}`] = tool;
      }
    }

    return allTools;
  }

  /**
   * Get a specific client by server name
   */
  getClient(serverName: string): Awaited<ReturnType<typeof createMCPClient>> | undefined {
    return this.clients.get(serverName);
  }

  /**
   * Get all connected server names
   */
  getConnectedServers(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    await Promise.all(
      Array.from(this.clients.keys()).map((name) => this.disconnect(name))
    );
  }
}
