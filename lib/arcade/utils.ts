import { jsonSchema, type ToolSet } from 'ai';
import { arcadeServer } from './server';

export const ARCADE_AUTHORIZATION = {
  REQUIRED: 'ARCADE_AUTHORIZATION_REQUIRED',
  TOOL_NAME: 'arcade-authorization',
  PENDING: 'ARCADE_AUTHORIZATION_PENDING',
  AUTHORIZED: 'ARCADE_AUTHORIZED',
  FAILED: 'ARCADE_AUTHORIZATION_FAILED',
  CANCELLED: 'ARCADE_AUTHORIZATION_CANCELLED',
} as const;

type FormattedTool = {
  type: 'function';
  function: {
    name: string;
    parameters: any;
    description: string;
  };
};

type FormattedToolList = {
  items: FormattedTool[];
};

export type GetToolsOptions = {
  userId: string;
  toolkit?: string;
};

export async function getTools({ userId, toolkit }: GetToolsOptions) {
  if (!arcadeServer) {
    console.error('Arcade server not initialized');
    return {} as ToolSet;
  }

  try {
    const arcadeTools = await arcadeServer.client.tools.list({
      limit: 1000,
      ...(toolkit && { toolkit }),
    });

    const formattedTools = (await arcadeServer.client.tools.formatted.list({
      limit: 1000,
      format: 'openai',
      ...(toolkit && { toolkit }),
    })) as FormattedToolList;

    // Create maps for arcadeTools and formattedTools using their names as keys
    const arcadeToolsMap = new Map(
      arcadeTools.items.map((tool) => [
        `${tool.toolkit.name}.${tool.name}`,
        tool,
      ]),
    );
    const formattedToolsMap = new Map(
      formattedTools.items.map((tool) => [
        formatOpenAIToolNameToArcadeToolName(tool.function.name),
        tool,
      ]),
    );

    // Traverse the arcadeToolsMap and create a valid ToolSet
    const tools: ToolSet = {};
    arcadeToolsMap.forEach((arcadeTool, name) => {
      // We get the formatted tool
      const formattedTool = formattedToolsMap.get(name);
      // If the formatted tool exists, we add it to the tools object
      const needsAuth = Boolean(arcadeTool.requirements?.authorization);
      if (formattedTool) {
        tools[formattedTool.function.name] = {
          parameters: jsonSchema(formattedTool.function.parameters),
          description: formattedTool.function.description,
          execute: needsAuth
            ? undefined // If the tool needs authorization, we omit the execute function to handle it in the client
            : async (input: any) => {
                if (!arcadeServer) {
                  throw new Error('Arcade server not initialized');
                }
                return await arcadeServer.client.tools.execute({
                  tool_name: name,
                  input,
                  user_id: userId,
                });
              },
        };
      }
    });

    return tools;
  } catch (error) {
    console.error('Error in getTools', error);
    return {} as ToolSet;
  }
}

export const formatOpenAIToolNameToArcadeToolName = (toolName: string) => {
  return toolName.replaceAll('_', '.');
};

export const getToolkitNameByOpenAIToolName = (toolName: string) => {
  // The toolkit name is the first part of the tool name
  return toolName.split('_').shift()?.toLowerCase();
};
