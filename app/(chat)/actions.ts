'use server';

import { generateText, Message } from 'ai';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/app/(auth)/auth';

import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
  addMcpServer,
  getMcpServersByUserId,
  getMcpServerByIdAndUserId,
  updateMcpServerStatus,
  deleteMcpServer,
} from '@/lib/db/queries';
import { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';

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

// --- MCP Server Actions ---

export async function fetchMcpServers() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: User not logged in.');
  }
  try {
    const servers = await getMcpServersByUserId({ userId: session.user.id });
    return servers;
  } catch (error) {
    console.error('Error fetching MCP servers:', error);
    throw new Error('Failed to fetch MCP servers.');
  }
}

export async function addMcpServerAction({
  name,
  config,
}: {
  name: string;
  config: Record<string, any>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: User not logged in.');
  }

  if (!name || !config) {
    throw new Error('Missing required fields: name and config.');
  }

  try {
    const newServer = await addMcpServer({
      userId: session.user.id,
      name,
      config,
    });
    revalidatePath('/settings'); // Revalidate the settings page
    return { success: true, server: newServer };
  } catch (error) {
    console.error('Error adding MCP server:', error);
    return { success: false, error: 'Failed to add MCP server.' };
  }
}

export async function toggleMcpServerAction({
  id,
  isEnabled,
}: {
  id: string;
  isEnabled: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: User not logged in.');
  }

  try {
    // Verify ownership before updating
    const existingServer = await getMcpServerByIdAndUserId({
      id,
      userId: session.user.id,
    });
    if (!existingServer) {
      throw new Error('Unauthorized: Server not found or not owned by user.');
    }

    const updatedServer = await updateMcpServerStatus({ id, isEnabled });
    revalidatePath('/settings'); // Revalidate the settings page
    return { success: true, server: updatedServer };
  } catch (error) {
    console.error('Error toggling MCP server status:', error);
    // Distinguish between auth errors and DB errors if needed
    const errorMessage = error instanceof Error && error.message.startsWith('Unauthorized')
      ? error.message
      : 'Failed to update MCP server status.';
    return { success: false, error: errorMessage };

  }
}

export async function deleteMcpServerAction({ id }: { id: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: User not logged in.');
  }

  try {
    // Verify ownership before deleting
    const existingServer = await getMcpServerByIdAndUserId({
      id,
      userId: session.user.id,
    });
    if (!existingServer) {
      throw new Error('Unauthorized: Server not found or not owned by user.');
    }

    await deleteMcpServer({ id });
    revalidatePath('/settings'); // Revalidate the settings page
    return { success: true };
  } catch (error) {
    console.error('Error deleting MCP server:', error);
    const errorMessage = error instanceof Error && error.message.startsWith('Unauthorized')
    ? error.message
    : 'Failed to delete MCP server.';
    return { success: false, error: errorMessage };
  }
}
