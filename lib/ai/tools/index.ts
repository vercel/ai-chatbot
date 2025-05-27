import type { DataStreamWriter, Tool as AITool } from 'ai';
import type { Session } from 'next-auth';
import { createDocument } from './create-document';
import { updateDocument } from './update-document';
import { requestSuggestions } from './request-suggestions';
import { getWeather } from './get-weather';

export interface ToolExecutionContext {
  session: Session;
  dataStream: DataStreamWriter;
  filter?: string[];
}

export type Tool = AITool & {
  tool: (args: ToolExecutionContext) => AITool;
};

export type ToolSet = Record<string, Tool>;

export const builtInTools: Record<string, Tool> = {
  getWeather: {
    description: 'Fetches the current weather',
    tool: () => getWeather,
    parameters: getWeather.parameters,
  },
  createDocument: {
    description: 'Creates a new document',
    tool: (args: ToolExecutionContext) => createDocument(args),
    parameters: createDocument.parameters,
  },
  updateDocument: {
    description: 'Updates an existing document',
    tool: (args: ToolExecutionContext) => updateDocument(args),
    parameters: updateDocument.parameters,
  },
  requestSuggestions: {
    description: 'Requests suggestions based on input',
    tool: (args: ToolExecutionContext) => requestSuggestions(args),
    parameters: requestSuggestions.parameters,
  },
} as const;
