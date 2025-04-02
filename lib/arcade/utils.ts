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

    const tools: ToolSet = {};
    for (const item of arcadeTools.items) {
      if (!item.name) continue;

      const toolName = `${item.toolkit.name}.${item.name}`;

      const formattedTool = (await arcadeServer.client.tools.formatted.get(
        toolName,
        {
          format: 'openai',
        },
      )) as {
        function: {
          name: string;
          parameters: any;
        };
      };

      const needsAuth = Boolean(item.requirements?.authorization);

      tools[formattedTool.function.name] = {
        parameters: jsonSchema(formattedTool.function.parameters),
        description: item.description,
        execute: needsAuth
          ? undefined // If the tool needs authorization, we omit the execute function to handle it in the client
          : async (input: any) => {
              if (!arcadeServer) {
                throw new Error('Arcade server not initialized');
              }
              return await arcadeServer.client.tools.execute({
                tool_name: toolName,
                input,
                user_id: userId,
              });
            },
      };
    }

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
