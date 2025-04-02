import '@arcadeai/arcadejs/shims/web';
import { Arcade, PermissionDeniedError } from '@arcadeai/arcadejs';
import { formatOpenAIToolNameToArcadeToolName } from './utils';
import type { AuthorizationResponse } from '@arcadeai/arcadejs/resources/shared.mjs';

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

  public async waitForAuthAndExecute({
    authId,
    toolName,
    args,
    userId,
  }: {
    authId: string;
    toolName: string;
    args: any;
    userId: string;
  }): Promise<ExecuteToolResult> {
    try {
      const auth = await this.client.auth.waitForCompletion({ id: authId });
      const result = await this.client.tools.execute({
        tool_name: formatOpenAIToolNameToArcadeToolName(toolName),
        input: args,
        user_id: userId,
      });

      return { result, authResponse: auth };
    } catch (error) {
      console.error('Error waiting for auth and executing tool', error);
      return { error: 'Failed to complete authorization and execute tool' };
    }
  }
}

// Only create the instance if we're on the server side
const arcadeServer =
  typeof window === 'undefined' ? ArcadeServer.getInstance() : null;

export { arcadeServer };
