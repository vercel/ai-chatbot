'use server';

// Original imports + necessary additions for title gen
import { generateText, type Message } from 'ai'; // Use 'type Message' for title gen
import { cookies } from 'next/headers';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';
// Add necessary DB imports if queries don't cover them (assuming queries handle types)
// import { db } from '@/lib/db';
// import type { Chat, Message_v2, DBMessage } from '@/lib/db/schema';
// import { auth } from '@clerk/nextjs/server';
// import { and, asc, eq, gt } from 'drizzle-orm';
// import { redirect } from 'next/navigation';
// import { revalidatePath } from 'next/cache';

// Original function - unmodified
export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

// --- NEW Title Generation Logic ---

// Validation function
const isValidTitle = (title: string): boolean => {
  const maxLen = 80;
  if (!title || title.length === 0 || title.length > maxLen) {
    console.log(`[isValidTitle] Failed: Empty or Too Long (${title?.length})`);
    return false;
  }
  if (title.startsWith('{') || title.startsWith('[')) {
    console.log(`[isValidTitle] Failed: Starts with { or [`);
    return false;
  }
  if (title.startsWith('```')) {
    console.log(`[isValidTitle] Failed: Starts with \`\`\``);
    return false;
  }
  if (/\\n.*\\n/.test(title)) {
    // Check for 2 or more newlines anywhere
    console.log(`[isValidTitle] Failed: Contains multiple newlines`);
    return false;
  }
  console.log(`[isValidTitle] Passed for: "${title}"`);
  return true;
};

// New generateTitleFromUserMessage function
export async function generateTitleFromUserMessage({
  message,
}: { message: Message }) {
  // Use Message type from 'ai'
  console.log('[generateTitleFromUserMessage] Starting title generation...');

  // Extract text content robustly
  let userTextContent = '';
  if (typeof message.content === 'string') {
    userTextContent = message.content;
  } else if (Array.isArray(message.content)) {
    // Ensure message.content is treated as array of parts
    const contentArray = message.content as Array<{
      type: string;
      text?: string;
    }>;
    // Find the first text part
    const textPart = contentArray.find((part) => part.type === 'text');
    if (textPart && typeof textPart.text === 'string') {
      userTextContent = textPart.text;
    } else {
      console.warn(
        '[generateTitleFromUserMessage] No text part found in message content array.',
      );
      userTextContent = 'Media message'; // Fallback for non-text primary content
    }
  }

  if (!userTextContent || userTextContent.trim().length === 0) {
    console.warn(
      '[generateTitleFromUserMessage] Could not extract valid text content. Falling back to "Chat".',
    );
    return 'Chat';
  }

  // Ensure the model name is correct based on your providers.ts
  const model = myProvider.languageModel('title-model');

  // --- Attempt 1 ---
  const systemPrompt1 = `
    You are a world-class title generator for conversations. You excel at guessing context based on the very first message.
    Generate a concise, plain-text title summarizing the user message below.
    RULES:
    - STRICT maximum 80 characters.
    - PLAIN TEXT ONLY.
    - ABSOLUTELY NO JSON format.
    - ABSOLUTELY NO code fences (\`\`\`).
    - DO NOT use quotes or colons in the title unless essential for meaning.
    - DO NOT repeat the user's message verbatim.
    - You should NOT summarize the user's message, but rather create a title for the conversation likely to ensue.
    - If the user's message is simply 'hi' or something generic like that, return "New Chat".`;

  let title = ''; // Use this for attempt 1 result
  try {
    console.log('[generateTitleFromUserMessage] Attempt 1...');
    const result1 = await generateText({
      model: model,
      system: systemPrompt1,
      prompt: userTextContent,
    });
    title = result1.text.trim(); // Assign to outer scope 'title'
    console.log(
      `[generateTitleFromUserMessage] Attempt 1 Raw Result: "${result1.text}", Trimmed: "${title}"`,
    );

    if (isValidTitle(title)) {
      console.log('[generateTitleFromUserMessage] Attempt 1 Valid. Returning.');
      return title;
    }
    console.warn(
      `[generateTitleFromUserMessage] Attempt 1 FAILED validation for title: "${title}"`,
    );
  } catch (error) {
    console.error(
      '[generateTitleFromUserMessage] AI call failed (Attempt 1):',
      error,
    );
  }

  // --- Attempt 2 ---
  const systemPrompt2 = `
    The previous attempt to generate a title failed validation (Max 80 chars, plain text, no JSON, no code fences). The FAILED title was: "${title}"
    Based on the user message below, generate an EXTREMELY concise, plain-text title.
    RULES:
    - STRICT MAXIMUM 80 characters.
    - PLAIN TEXT ONLY. No complex formatting.
    - NO JSON. NO code fences (\`\`\`).
    - Summarize the topic very simply.`;

  let title2 = ''; // Use this for attempt 2 result
  try {
    console.log('[generateTitleFromUserMessage] Attempt 2...');
    const result2 = await generateText({
      model: model,
      system: systemPrompt2,
      prompt: userTextContent,
    });
    title2 = result2.text.trim(); // Assign to title2
    console.log(
      `[generateTitleFromUserMessage] Attempt 2 Raw Result: "${result2.text}", Trimmed: "${title2}"`,
    );

    if (isValidTitle(title2)) {
      console.log('[generateTitleFromUserMessage] Attempt 2 Valid. Returning.');
      return title2;
    }
    console.warn(
      `[generateTitleFromUserMessage] Attempt 2 FAILED validation for title: "${title2}"`,
    );
  } catch (error) {
    console.error(
      '[generateTitleFromUserMessage] AI call failed (Attempt 2):',
      error,
    );
  }

  // --- Fallback Sanitize ---
  console.log(
    '[generateTitleFromUserMessage] Both attempts failed validation or API error. Sanitizing...',
  );
  const titleToSanitize = title2 || title || '';
  console.log(
    `[generateTitleFromUserMessage] Sanitizing base title: "${titleToSanitize}"`,
  );
  const sanitizedTitle = titleToSanitize // Use const
    .replace(/```[\\s\\S]*?```/g, '') // Remove code blocks first
    .replace(/\\{[^{}]*\\}|\\[[^\\[\\]]*\\]/g, '') // Remove simple {} or [] pairs and content
    .replace(/\\n+/g, ' ') // Replace newlines with space
    .replace(/[{}[\\]\`]/g, '') // Remove remaining stray brackets or backticks
    .trim();

  console.log(`[generateTitleFromUserMessage] Sanitized: "${sanitizedTitle}"`);

  const truncatedTitle = sanitizedTitle.substring(0, 80).trim(); // Use const

  if (truncatedTitle.length === 0) {
    console.warn(
      '[generateTitleFromUserMessage] Sanitization resulted in empty string. Falling back to "Chat".',
    );
    return 'Chat';
  }

  console.log(
    `[generateTitleFromUserMessage] Returning sanitized/truncated title: "${truncatedTitle}"`,
  );
  return truncatedTitle;
}

// --- END NEW Title Generation Logic ---

// Original function - Restore original destructuring
export async function deleteTrailingMessages({ id }: { id: string }) {
  // Assign directly instead of destructuring
  const message = await getMessageById({ id });

  // Add safety check (optional but good practice)
  if (!message) {
    console.error(`[deleteTrailingMessages] Message with id ${id} not found.`);
    // Consider if throwing an error is more appropriate than returning void
    // throw new Error(`Message with id ${id} not found.`);
    return;
  }

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

// Original function - unmodified
export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}
