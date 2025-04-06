import '@arcadeai/arcadejs/shims/web';
import { Arcade, PermissionDeniedError } from '@arcadeai/arcadejs';
import { formatOpenAIToolNameToArcadeToolName } from './utils';
import type { AuthorizationResponse } from '@arcadeai/arcadejs/resources/shared.mjs';
import { jsonSchema, type ToolSet } from 'ai';

type FormattedTool = {
  function: {
    name: string;
    parameters: any;
    description: string;
  };
};

type FormattedToolList = {
  items: FormattedTool[];
};

export type ExecuteToolResult = {
  result?: any;
  authResponse?: AuthorizationResponse;
  error?: string;
};

class ArcadeServer {
  private static instance: ArcadeServer;
  public readonly client: Arcade;

  private constructor() {
    const apiKey = process.env.ARCADE_API_KEY;
    if (!apiKey) {
      console.error('ARCADE_API_KEY is not set in environment variables');
      throw new Error('ARCADE_API_KEY is not set');
    }
    this.client = new Arcade({
      apiKey,
      baseURL: process.env.ARCADE_BASE_URL,
    });
  }

  public static getInstance(): ArcadeServer {
    if (!ArcadeServer.instance) {
      ArcadeServer.instance = new ArcadeServer();
    }
    return ArcadeServer.instance;
  }

  public async executeTool({
    toolName,
    args,
    userId,
  }: {
    toolName: string;
    args: any;
    userId: string;
  }): Promise<ExecuteToolResult> {
    const formattedToolName = formatOpenAIToolNameToArcadeToolName(toolName);
    const tool = await this.client.tools.get(formattedToolName);

    if (!tool) {
      return { error: 'Tool not found' };
    }

    try {
      const result = await this.client.tools.execute({
        tool_name: formattedToolName,
        input: args,
        user_id: userId,
      });

      return { result };
    } catch (error) {
      if (error instanceof PermissionDeniedError) {
        const authInfo = await this.client.tools.authorize({
          tool_name: formattedToolName,
          user_id: userId,
        });

        return { authResponse: authInfo };
      } else {
        console.error('Error executing tool', error);
        return { error: 'Failed to execute tool' };
      }
    }
  }

  public async getTools({
    userId,
    toolkit,
  }: { userId: string; toolkit?: string }): Promise<ToolSet> {
    try {
      const arcadeTools = await this.client.tools.list({
        limit: 1000,
        ...(toolkit && { toolkit }),
      });

      const formattedTools = (await this.client.tools.formatted.list({
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
        const formattedTool = formattedToolsMap.get(name);
        const needsAuth = Boolean(arcadeTool.requirements?.authorization);
        if (formattedTool) {
          tools[formattedTool.function.name] = {
            parameters: jsonSchema(formattedTool.function.parameters),
            description: formattedTool.function.description,
            execute: needsAuth
              ? undefined
              : async (input: any) => {
                  return await this.client.tools.execute({
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

  public async getToolkits(): Promise<string[]> {
    const tools = await this.client.tools.list({
      limit: 1000,
    });
    const toolkitSet = new Set<string>();
    for (const tool of tools.items) {
      toolkitSet.add(tool.toolkit.name);
    }
    return Array.from(toolkitSet);
  }

  public async getToolsByToolkits({
    userId,
    toolkits,
  }: { userId: string; toolkits: string[] }): Promise<ToolSet> {
    if (!toolkits || toolkits.length === 0) {
      return this.getTools({ userId });
    }

    const tools: ToolSet = {};
    try {
      const toolkitPromises = toolkits.map((toolkit) =>
        this.getTools({ userId, toolkit }),
      );
      const toolkitResults = await Promise.all(toolkitPromises);

      for (const toolkitTools of toolkitResults) {
        Object.assign(tools, toolkitTools);
      }
      return tools;
    } catch (error) {
      console.error('Error fetching tools by toolkits:', error);
      return tools;
    }
  }
}

// Only create the instance if we're on the server side
const arcadeServer =
  typeof window === 'undefined' ? ArcadeServer.getInstance() : null;

export { arcadeServer };
