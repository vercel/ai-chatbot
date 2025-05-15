import type { DataStreamWriter, Tool, ToolSet, UIMessage } from 'ai';
import type { Session } from 'next-auth';
import { createDocument } from './create-document';
import { updateDocument } from './update-document';
import { requestSuggestions } from './request-suggestions';
import { getWeather } from './get-weather';
import { mcp } from './mcp';

export interface ToolExecutionArgs {
  session: Session;
  dataStream: DataStreamWriter;
  filter?: string[];
}

export type ExecutableToolSet = Record<string, Tool['execute']>;

export interface ToolMetadata {
  description: string;
  tool: (args: ToolExecutionArgs) => Tool;
  execute?: Tool['execute'];
  capabilities: 'executable' | 'non-executable';
  parameters?: Tool['parameters'];
}

export type ToolNameList = Array<keyof ReturnType<typeof tools>>;

const mcpToolList: Record<string, ToolMetadata> = Object.keys(mcp.tools).reduce(
  (acc, tool) => {
    acc[tool] = {
      description: mcp.tools[tool].description || '',
      execute: mcp.tools[tool].execute,
      tool: () => ({
        ...(mcp.tools[tool] as any),
        execute: undefined,
      }),
      capabilities: 'executable',
      parameters: mcp.tools[tool].parameters,
    };
    return acc;
  },
  {} as Record<string, ToolMetadata>,
);

const builtInToolList: Record<string, ToolMetadata> = {
  getWeather: {
    description: 'Fetches the current weather',
    tool: () => getWeather,
    parameters: getWeather.parameters,
    capabilities: 'non-executable',
  },
  createDocument: {
    description: 'Creates a new document',
    tool: (args: ToolExecutionArgs) => createDocument(args),
    parameters: createDocument.parameters,
    capabilities: 'non-executable',
  },
  updateDocument: {
    description: 'Updates an existing document',
    tool: (args: ToolExecutionArgs) => updateDocument(args),
    parameters: updateDocument.parameters,
    capabilities: 'non-executable',
  },
  requestSuggestions: {
    description: 'Requests suggestions based on input',
    tool: (args: ToolExecutionArgs) => requestSuggestions(args),
    parameters: requestSuggestions.parameters,
    capabilities: 'non-executable',
  },
} as const;

export const toolList = { ...mcpToolList, ...builtInToolList };

export const toolNames = Object.keys(toolList) as ToolNameList;

// @FIXME better type, list and types are duplicated
export const manifest = toolNames.reduce(
  (acc, tool) => {
    acc[tool] = {
      description: toolList[tool].description,
      capabilities: toolList[tool].capabilities,
      parameters: toolList[tool].parameters,
    };
    return acc;
  },
  {} as Record<string, Omit<ToolMetadata, 'tool'>>,
);

export function tools({
  session,
  dataStream,
  filter,
}: ToolExecutionArgs): ToolSet {
  return toolNames.reduce((acc, tool) => {
    if (filter?.includes(tool)) {
      acc[tool] = toolList[tool].tool({
        session,
        dataStream,
      });
    }

    return acc;
  }, {} as ToolSet);
}

export const executableFunctions = toolNames.reduce((acc, tool) => {
  if (toolList[tool].execute) {
    acc[tool] = toolList[tool].execute as Tool['execute'];
  }
  return acc;
}, {} as ExecutableToolSet);
