import fs from "node:fs/promises";
import path from "node:path";
import type { MCPConfig } from "./types";

/**
 * Load MCP configuration from a file
 */
export async function loadMCPConfig(
  configPath: string = "mcp.json"
): Promise<MCPConfig> {
  const absolutePath = path.isAbsolute(configPath)
    ? configPath
    : path.join(process.cwd(), configPath);

  const content = await fs.readFile(absolutePath, "utf-8");
  const config = JSON.parse(content) as MCPConfig;

  return config;
}

/**
 * Validate MCP configuration
 */
export function validateMCPConfig(config: MCPConfig): void {
  if (!config.servers || typeof config.servers !== "object") {
    throw new Error("Invalid MCP config: 'servers' must be an object");
  }

  for (const [serverName, serverConfig] of Object.entries(config.servers)) {
    if (serverConfig.type === "stdio") {
      if (!serverConfig.command) {
        throw new Error(
          `Invalid MCP config: server '${serverName}' missing 'command' for stdio transport`
        );
      }
      if (!Array.isArray(serverConfig.args)) {
        throw new Error(
          `Invalid MCP config: server '${serverName}' 'args' must be an array for stdio transport`
        );
      }
    } else if (serverConfig.type === "http" || serverConfig.type === "sse") {
      if (!serverConfig.url) {
        throw new Error(
          `Invalid MCP config: server '${serverName}' missing 'url' for ${serverConfig.type} transport`
        );
      }
    } else {
      throw new Error(
        `Invalid MCP config: server '${serverName}' has unsupported type '${serverConfig.type}'`
      );
    }
  }
}
