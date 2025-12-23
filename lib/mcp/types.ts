export type MCPServerConfig = {
  // stdio transport (will be available in AI SDK 6 stable)
  command?: string;
  args?: string[];
  // http/sse transport (currently supported in beta)
  url?: string;
  env?: Record<string, string>;
  type: "stdio" | "http" | "sse";
};

export type MCPInput = {
  id: string;
  type: "promptString";
  description: string;
  password?: boolean;
};

export type MCPConfig = {
  servers: Record<string, MCPServerConfig>;
  inputs?: MCPInput[];
};
