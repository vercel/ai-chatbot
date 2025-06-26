import { myProvider } from '@/lib/ai/providers';
import { sheetPrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { getMessagesByChatId } from '@/lib/db/queries';
import type { DBMessage } from '@/lib/db/schema';
import { streamObject } from 'ai';
import { z } from 'zod';

// Helper function to extract content from message parts
const extractContentFromParts = (parts: any[]): string => {
  if (!parts || !Array.isArray(parts)) return '';

  return parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join(' ')
    .trim();
};

// Helper function to convert database messages to context
const convertDbMessagesToContext = (dbMessages: DBMessage[]): string => {
  return dbMessages
    .map(
      (msg) => `
${msg.role === 'user' ? 'User' : 'Assistant'}: ${extractContentFromParts(msg.parts as any[])}
  `,
    )
    .join('\n');
};

export const sheetDocumentHandler = createDocumentHandler<'sheet'>({
  kind: 'sheet',
  onCreateDocument: async ({ title, dataStream, session, chatId }) => {
    let draftContent = '';

    // Fetch actual messages from the database using the chatId
    let contextPrompt = title;

    try {
      const dbMessages = await getMessagesByChatId({ id: chatId });

      if (dbMessages.length > 0) {
        const conversationContext = convertDbMessagesToContext(dbMessages);
        contextPrompt = `${title}

Context from current conversation:
${conversationContext}`;
      }
    } catch (error) {
      console.error('Failed to fetch messages for sheet:', error);
    }

    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: sheetPrompt,
      prompt: contextPrompt,
      schema: z.object({
        csv: z.string().describe('CSV data'),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { csv } = object;

        if (csv) {
          dataStream.writeData({
            type: 'sheet-delta',
            content: csv,
          });

          draftContent = csv;
        }
      }
    }

    dataStream.writeData({
      type: 'sheet-delta',
      content: draftContent,
    });

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(document.content, 'sheet'),
      prompt: description,
      schema: z.object({
        csv: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { csv } = object;

        if (csv) {
          dataStream.writeData({
            type: 'sheet-delta',
            content: csv,
          });

          draftContent = csv;
        }
      }
    }

    return draftContent;
  },
});
