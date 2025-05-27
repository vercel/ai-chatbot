import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import {
  experimental_createMCPClient,
  type Tool,
  type MCPTransport as MCPTransportType,
} from 'ai';
import {
  StreamableHTTPClientTransport,
  type StreamableHTTPClientTransportOptions,
} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { IOType } from 'node:child_process';
import type { Stream } from 'node:stream';

type Experimental_SseMCPTransport = Exclude<
  Parameters<typeof experimental_createMCPClient>[0]['transport'],
  MCPTransportType
>;

export type MCPTransport =
  | Experimental_StdioMCPTransport
  | Experimental_SseMCPTransport
  | StreamableHTTPClientTransport;

export type MCPTransportConfig = Record<string, MCPTransport>;

export type MCPTool = Tool & {
  id?: string;
};

export type MCPClient = Awaited<
  ReturnType<typeof experimental_createMCPClient>
>;

export interface MCPHTTPConfig {
  url?: string;
  headers?: Record<string, string>;
  options?: StreamableHTTPClientTransportOptions;
}

export interface MCPStdioConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  stderr?: IOType | Stream | number;
  cwd?: string;
}

export type MCPServerType = 'remote' | 'stdio';

export interface MCPServerConfig extends MCPHTTPConfig, MCPStdioConfig {
  type: MCPServerType;
  name: string;
  env?: Record<string, string>;
  enabled: boolean;
  available: boolean;
}

export async function createMCPTransport(
  config: MCPServerConfig,
): Promise<MCPTransport | undefined> {
  if (config.command) {
    return new Experimental_StdioMCPTransport({
      command: config.command,
      args: config.args,
      env: config.env,
      stderr: config.stderr,
      cwd: config.cwd,
    });
  } else if (config.url?.endsWith('/sse')) {
    return {
      type: 'sse',
      url: config.url,
      headers: {
        ...config?.headers,
      },
    };
  } else if (config.url?.endsWith('/mcp')) {
    return new StreamableHTTPClientTransport(
      new URL(config.url),
      config?.options,
    );
  }
}

export const createMCPClient = experimental_createMCPClient;
