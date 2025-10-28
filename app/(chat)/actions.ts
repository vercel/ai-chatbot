"use server";

import { generateText, type UIMessage } from "ai";
import { cookies } from "next/headers";
import type { VisibilityType } from "@/components/visibility-selector";
import { myProvider } from "@/lib/ai/providers";
import {
  deleteMessagesByChatIdAfterTimestamp,
  deleteMessagesByChatIdFromTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from "@/lib/db/queries";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel("title-model"),
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
  const messages = await getMessageById({ id });
  const message = messages[0];

  if (!message) {
    throw new Error(`Message with id ${id} not found`);
  }

  await deleteMessagesByChatIdFromTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt, // Delete from the current message onwards
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

export async function createNewMessageVersion({
  originalMessageId,
  newContent,
  chatId,
  userId,
}: {
  originalMessageId: string;
  newContent: string;
  chatId: string;
  userId: string;
}) {
  // Use the old versioning system from queries.ts
  const { createMessageVersion } = await import("@/lib/db/queries");
  const { generateUUID } = await import("@/lib/utils");
  
  const newMessageId = generateUUID();
  
  const result = await createMessageVersion({
    originalMessageId,
    newMessageId,
    chatId,
    role: "user", // User message
    parts: [{ type: "text", text: newContent }],
    attachments: [],
    userId,
  });

  // Delete AI responses after the original message timestamp
  const messages = await getMessageById({ id: originalMessageId });
  const originalMessage = messages[0];
  
  if (originalMessage) {
    await deleteMessagesByChatIdAfterTimestamp({
      chatId,
      timestamp: originalMessage.createdAt,
    });
  }

  return result;
}

// Old versioning system actions
export async function getMessageVersionsAction({
  messageId,
  limit = 50,
  offset = 0,
}: {
  messageId: string;
  limit?: number;
  offset?: number;
}) {
  const { getMessageVersions, getMessageById } = await import("@/lib/db/queries");
  try {
    // First, find the message to get its versionGroupId
    const messages = await getMessageById({ id: messageId });
    if (messages.length === 0) {
      return [];
    }
    
    const message = messages[0] as any;
    // Use versionGroupId if available, otherwise use the messageId itself
    const versionGroupId = message.versionGroupId || messageId;
    
    return await getMessageVersions({ versionGroupId });
  } catch (error) {
    console.error("Failed to get message versions:", error);
    return [];
  }
}

export async function editMessageAction({
  messageId,
  authorId,
  newContent,
  editReason,
  clientLatestVersion,
}: {
  messageId: string;
  authorId: string;
  newContent: any;
  editReason?: string;
  clientLatestVersion?: number;
}) {
  const { createMessageVersion } = await import("@/lib/db/queries");
  const { generateUUID } = await import("@/lib/utils");
  
  try {
    // Get the original message to find chatId
    const messages = await getMessageById({ id: messageId });
    const originalMessage = messages[0];
    
    if (!originalMessage) {
      return {
        success: false,
        message: "Original message not found",
      };
    }

    const newMessageId = generateUUID();
    const result = await createMessageVersion({
      originalMessageId: messageId,
      newMessageId,
      chatId: originalMessage.chatId,
      role: originalMessage.role,
      parts: newContent,
      attachments: originalMessage.attachments || [],
      userId: authorId,
    });

    return {
      success: true,
      message: "Message edited successfully",
      version: result,
    };
  } catch (error) {
    console.error("Failed to edit message:", error);
    return {
      success: false,
      message: "Failed to edit message. Please try again.",
    };
  }
}

export async function switchToVersionAction({
  messageId,
  versionNumber,
}: {
  messageId: string;
  versionNumber: number;
}) {
  const { switchToMessageVersion } = await import("@/lib/db/queries");
  try {
    // Use messageId as versionGroupId for the old system
    const version = await switchToMessageVersion({ 
      versionGroupId: messageId, 
      targetVersionNumber: versionNumber 
    });
    
    if (!version) {
      return {
        success: false,
        message: "Version not found",
      };
    }

    return {
      success: true,
      version,
    };
  } catch (error) {
    console.error("Failed to switch to version:", error);
    return {
      success: false,
      message: "Failed to switch version. Please try again.",
    };
  }
}

// Legacy function kept for compatibility - uses old system
export async function switchMessageVersionAction({
  versionGroupId,
  targetVersionNumber,
  chatId,
}: {
  versionGroupId: string;
  targetVersionNumber: number;
  chatId: string;
}) {
  const { switchToMessageVersion } = await import("@/lib/db/queries");
  return await switchToMessageVersion({
    versionGroupId,
    targetVersionNumber,
  });
}
