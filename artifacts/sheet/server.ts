import { myProvider } from '@/lib/ai/providers';
import { sheetPrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { streamObject } from 'ai';
import { z } from 'zod';

export const sheetDocumentHandler = createDocumentHandler<'sheet'>({
  kind: 'sheet',
  onCreateDocument: async ({ title, dataStream, instructions }) => {
    let draftContent = '';

    const systemPromptWithInstructions = `${sheetPrompt} ${instructions ? `IMPORTANT: Adhere to the following user instructions: ${instructions}` : ''}`;

    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: systemPromptWithInstructions,
      prompt: title,
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
  onUpdateDocument: async ({
    document,
    description,
    dataStream,
    instructions,
  }) => {
    let draftContent = '';

    const baseSystemPrompt = updateDocumentPrompt(document.content, 'sheet');
    const systemPromptWithInstructions = `${baseSystemPrompt} ${instructions ? `IMPORTANT: Also adhere to the following user instructions for this update: ${instructions}` : ''}`;

    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: systemPromptWithInstructions,
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
