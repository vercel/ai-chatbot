'use server';

import { client } from '@/lib/arcade/client';
import { formatOpenAIToolNameToArcadeToolName } from '@/lib/arcade/utils';
import { PermissionDeniedError } from '@arcadeai/arcadejs';
import type { AuthorizationResponse } from '@arcadeai/arcadejs/resources/shared.mjs';
import { auth } from '@/app/(auth)/auth';

export type ExecuteToolResult = {
  result?: any;
  authResponse?: AuthorizationResponse;
  error?: string;
};

export async function executeTool({
  toolName,
  args,
}: {
  toolName: string;
  args: any;
}): Promise<ExecuteToolResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  console.log('session', session, session?.user?.id);

  const formattedToolName = formatOpenAIToolNameToArcadeToolName(toolName);
  const tool = await client.tools.get(formattedToolName);

  if (!tool) {
    return { error: 'Tool not found' };
  }

  try {
    const result = await client.tools.execute({
      tool_name: formattedToolName,
      input: args,
      user_id: session.user.id,
    });

    return { result };
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      const authInfo = await client.tools.authorize({
        tool_name: formattedToolName,
        user_id: session.user.id,
      });

      return { authResponse: authInfo };
    } else {
      console.error('Error executing tool', error);
      return { error: 'Failed to execute tool' };
    }
  }
}

export async function waitForAuthAndExecute({
  authId,
  toolName,
  args,
}: {
  authId: string;
  toolName: string;
  args: any;
}): Promise<ExecuteToolResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  try {
    const auth = await client.auth.waitForCompletion({ id: authId });
    const result = await client.tools.execute({
      tool_name: formatOpenAIToolNameToArcadeToolName(toolName),
      input: args,
      user_id: session.user.id,
    });

    return { result, authResponse: auth };
  } catch (error) {
    console.error('Error waiting for auth and executing tool', error);
    return { error: 'Failed to complete authorization and execute tool' };
  }
}
