export interface SessionConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt: string;
  toolOptions?: {
    codeInterpreter: boolean;
    database: boolean;
    webSearch: boolean;
    fileUpload: boolean;
  };
  allowedTools?: string[];
  maxTurns?: number;
  permissionMode?: string;
  cwd?: string;
}