import { z } from 'zod';
import { streamObject } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { codePrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';

export const codeDocumentHandler = createDocumentHandler<'code'>({
  kind: 'code',
  onCreateDocument: async ({ title, dataStream, initialContent }) => {
    let draftContent = initialContent || '';

    if (!initialContent) {
      const { fullStream } = streamObject({
        model: myProvider.languageModel('artifact-model'),
        system: codePrompt,
        prompt: title,
        schema: z.object({
          code: z.string().min(1, 'Code cannot be empty'),
        }),
      });

      for await (const delta of fullStream) {
        const { type } = delta;

        if (type === 'object') {
          const { object } = delta;
          const { code } = object;

          if (code) {
            dataStream.writeData({
              type: 'code-delta',
              content: code,
            });

            draftContent = code;
          }
        }
      }
    } else {
      // If we have initial content, use it directly
      dataStream.writeData({
        type: 'code-delta',
        content: initialContent,
      });
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(document.content, 'code'),
      prompt: description,
      schema: z.object({
        code: z.string().min(1, 'Code cannot be empty'),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { code } = object;

        if (code) {
          dataStream.writeData({
            type: 'code-delta',
            content: code,
          });

          draftContent = code;
        }
      }
    }

    return draftContent;
  },
});
