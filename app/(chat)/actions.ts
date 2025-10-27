"use server";

import { generateText, type UIMessage } from "ai";
import { cookies } from "next/headers";
import type { VisibilityType } from "@/components/visibility-selector";
import { myProvider } from "@/lib/ai/providers";
import {
  createMessageVersion,
  deleteMessagesByChatIdAfterTimestamp,
  deleteMessagesByChatIdFromTimestamp,
  getMessageById,
  getMessageVersions,
  switchToMessageVersion,
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
  const messages = await getMessageById({ id: originalMessageId });
  const originalMessage = messages[0];
  
  if (!originalMessage) {
    throw new Error("Original message not found");
  }

  // Generate new message ID
  const { generateUUID } = await import("@/lib/utils");
  const newMessageId = generateUUID();

  // First, create new version of the user message
  const newVersion = await createMessageVersion({
    originalMessageId,
    newMessageId,
    chatId,
    role: originalMessage.role,
    parts: [{ type: "text", text: newContent }],
    attachments: originalMessage.attachments || [],
    userId,
  });

  // Then delete all AI responses after the original message timestamp
  await deleteMessagesByChatIdAfterTimestamp({
    chatId,
    timestamp: originalMessage.createdAt,
  });

  return newVersion;
}

export async function getMessageVersionsAction({
  versionGroupId,
}: {
  versionGroupId: string;
}) {
  return await getMessageVersions({ versionGroupId });
}

export async function switchMessageVersionAction({
  versionGroupId,
  targetVersionNumber,
  chatId,
}: {
  versionGroupId: string;
  targetVersionNumber: number;
  chatId: string;
}) {
  // First, get the target version to find when it was created
  const versions = await getMessageVersions({ versionGroupId });
  const targetVersion = versions.find(v => v.versionNumber === targetVersionNumber);
  
  if (!targetVersion) {
    throw new Error("Target version not found");
  }

  // Delete all AI messages after this version's timestamp
  await deleteMessagesByChatIdAfterTimestamp({
    chatId,
    timestamp: targetVersion.createdAt,
  });

  // Switch to the target version
  return await switchToMessageVersion({ versionGroupId, targetVersionNumber });
}

export async function checkMessageVersions({
  messageId,
}: {
  messageId: string;
}) {
  console.log("Checking versions for message:", messageId);
  
  // Check if this message has versions using it as version group ID
  const directVersions = await getMessageVersions({ versionGroupId: messageId });
  console.log("Direct versions:", directVersions.length);
  
  return {
    messageId,
    directVersions: directVersions.length,
    versions: directVersions
  };
}
