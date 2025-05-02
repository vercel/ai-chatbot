import fs from 'node:fs/promises';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import {
  experimental_createMCPClient,
  type Tool,
  type MCPTransport as MCPTransportType,
} from 'ai';

const MCP_SERVER_CONFIG_PATH =
  process.env.MCP_SERVER_CONFIG_PATH ?? './mcp-servers.json';
const MCP_SERVER_DEFAULT_CONFIG_NAME =
  process.env.MCP_SERVER_DEFAULT_CONFIG_NAME ?? 'mcpServers';

type Experimental_SseMCPTransport = Exclude<
  Parameters<typeof experimental_createMCPClient>[0]['transport'],
  MCPTransportType
>;

type MCPTransport =
  | Experimental_StdioMCPTransport
  | Experimental_SseMCPTransport;

async function readMCPServerConfig(
  mcpServerConfigPath: string,
  defaultConfigName?: string,
) {
  const json = JSON.parse(await fs.readFile(mcpServerConfigPath, 'utf-8'));
  const config = defaultConfigName ? json[defaultConfigName] : json;

  if (!config) {
    throw new Error(
      `Not found ${defaultConfigName} property in MCP server config`,
    );
  }

  return config;
}

export type MCPTransportConfig = Record<string, MCPTransport>;
export type MCPTool = Tool;

async function createMCPTransports(
  config: Record<string, any>,
): Promise<MCPTransportConfig> {
  try {
    return Object.entries(config).reduce((acc, [name, option]) => {
      if (option.command) {
        acc[name] = new Experimental_StdioMCPTransport({
          command: option.command,
          args: option.args,
          env: option.env,
          stderr: option.stderr,
          cwd: option.cwd,
        });
      } else if (option.url) {
        acc[name] = { type: 'sse', ...option } as Experimental_SseMCPTransport;
      } else {
        throw new Error('MCP server config has no command or url property.');
      }

      return acc;
    }, {} as MCPTransportConfig);
  } catch (error) {
    console.error('Failed parsed MCP configs', error);
    throw error;
  }
}

async function createMCPTools() {
  const config = await readMCPServerConfig(
    MCP_SERVER_CONFIG_PATH,
    MCP_SERVER_DEFAULT_CONFIG_NAME,
  );

  const transports = await createMCPTransports(config);

  const clients = await Promise.all(
    Object.keys(transports).map((name) =>
      experimental_createMCPClient({ transport: transports[name] }),
    ),
  );

  const tools: Record<string, MCPTool> = {};

  for (const client of clients) {
    for (const [name, tool] of Object.entries(await client.tools())) {
      tools[name] = tool;
    }
  }

  const toolList = Object.keys(tools);

  return {
    clients,
    tools,
    toolList,
  };
}

const mcp = await createMCPTools();

Object.freeze(mcp);

export { mcp };
