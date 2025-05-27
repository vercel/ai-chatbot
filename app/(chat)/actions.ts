'use server';

import { generateText, type ToolSet, type Message } from 'ai';
import { cookies } from 'next/headers';

import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';

import {
  createMCPClient,
  createMCPTransport,
  type MCPClient,
  type MCPTransport,
  type MCPServerConfig,
} from '@/lib/ai/mcp';
import { builtInTools, type ToolExecutionContext } from '../../lib/ai/tools';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: Message;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel('title-model'),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}

export async function queryMCPTools({
  mcpServerConfigs,
}: { mcpServerConfigs: Record<string, MCPServerConfig> }) {
  const { tools, error } = await createMCPTools({
    mcpServerConfigs,
  });

  return {
    tools: JSON.stringify(tools),
    error: error,
  };
}

interface MCPToolResources {
  transports: Record<string, MCPTransport>;
  tools: Record<string, any>;
  clients: Array<{ client: MCPClient; serverName: string }>;
}

async function createMCPTools({
  mcpServerConfigs,
}: {
  mcpServerConfigs: Record<string, MCPServerConfig>;
}): Promise<MCPToolResources & { error: string | null }> {
  const error = {
    message: '',
    name: '',
  };

  const resources: {
    transports: Record<string, any>;
    tools: Record<string, any>;
    clients: any[];
  } = {
    transports: {},
    tools: {},
    clients: [],
  };

  try {
    // @PLAN: use robust type for transport, client, and tool metadata
    for (const [name, config] of Object.entries(mcpServerConfigs)) {
      error.name = name;

      const transport = await createMCPTransport(config);
      if (!transport) {
        throw new Error(`Failed to create transport for ${name}`);
      }

      resources.transports[name] = {
        transport,
        serverName: name,
      };
    }

    for (const name of Object.keys(resources.transports)) {
      error.name = name;

      const client = await createMCPClient({
        transport: resources.transports[name].transport,
      });

      resources.clients.push({
        client,
        serverName: resources.transports[name].serverName,
      });
    }

    for (const { client, serverName } of resources.clients.filter(
      (client) => client !== undefined,
    )) {
      for (const [name, tool] of Object.entries(await client.tools())) {
        error.name = name;

        resources.tools[name] = {
          ...(tool as any),
          serverName: serverName,
        };
      }
    }
  } catch (err) {
    console.log('[debug] Error creating MCP tools:', err);
    error.message = `${(err as Error).message || 'Unknown error'} for '${error.name}'`;
  }

  return {
    ...resources,
    error: error.message.length > 0 ? error.message : null,
  };
}

export async function closeMCPClients(clients: any[]): Promise<void> {
  for (const client of clients) {
    try {
      await client.close();
    } catch (error) {
      console.error('Error closing MCP client:', error);
    }
  }
}

export async function initializeTools({
  mcpServerConfigs,
}: {
  mcpServerConfigs: Record<string, MCPServerConfig>;
}) {
  const { tools: mcpTools, clients } = await createMCPTools({
    mcpServerConfigs,
  });

  const toolSet = Object.entries(mcpTools).reduce((acc, [name, tool]) => {
    acc[name] = {
      description: tool.description || '',
      execute: tool.execute,
      tool: () => ({
        ...tool,
        execute: undefined,
      }),
      parameters: tool.parameters,
    };
    return acc;
  }, builtInTools);

  return {
    toolSet,
    tools: ({ session, dataStream }: ToolExecutionContext) => {
      return Object.keys(toolSet).reduce((acc, tool) => {
        acc[tool] = toolSet[tool].tool({
          session,
          dataStream,
        });

        return acc;
      }, {} as ToolSet);
    },
    closeClients: async () => {
      return await closeMCPClients(clients);
    },
  };
}
