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
}: {
  message: UIMessage;
}) {
  try {
    // Extract text content from message parts
    const messageText = typeof message.parts === 'string' 
      ? message.parts 
      : message.parts.map((part: any) => part.text || part).join(' ');

    const { text: title } = await generateText({
      model: myProvider.languageModel("npo-yen-model"),
      system: `\n
      - you will generate a short title based on the first message a user begins a conversation with
      - ensure it is not more than 80 characters long
      - the title should be a summary of the user's message
      - do not use quotes or colons`,
      messages: [
        {
          role: "user",
          content: messageText
        }
      ],
    });

    return title;
  } catch (error) {
    console.error("Error generating title:", error);
    // Fallback title nếu không thể generate được
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
