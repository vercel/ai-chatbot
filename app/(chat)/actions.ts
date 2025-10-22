"use server";

import { generateText, type UIMessage } from "ai";
import { cookies } from "next/headers";
import type { VisibilityType } from "@/components/visibility-selector";
import { myProvider } from "@/lib/ai/providers";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from "@/lib/db/queries";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function generateTitleFromUserMessage({
  message,
  selectedChatModel,
}: {
  message: UIMessage;
  selectedChatModel: string;
}) {
  try {
    // Extract text content from message parts
    const messageText = typeof message.parts === 'string' 
      ? message.parts 
      : message.parts.map((part: any) => part.text || part).join(' ');

    // message text for title, format
    const title = messageText.slice(0, 50) + (messageText.length > 50 ? '...' : '');
    return title;
  } catch (error) {
    console.error("Error generating title:", error);
    // Fallback title if not possible to generate
    const userMessage = typeof message.parts === 'string' 
      ? message.parts 
      : message.parts.map((part: any) => part.text || part).join(' ');
    return userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '');
  }
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
