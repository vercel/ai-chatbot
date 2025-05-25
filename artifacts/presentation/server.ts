import { z } from 'zod';
import { streamObject } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { presentationPrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';

export const presentationDocumentHandler = createDocumentHandler({
  kind: 'presentation',
  onCreateDocument: async ({ title, dataStream, session, id }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: presentationPrompt,
      prompt: title,
      schema: z.object({
        presentation: z.string().describe('Markdown content for Spectacle presentation with multiple slides'),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { presentation } = object;

        if (presentation) {
          dataStream.writeData({
            type: 'presentation-delta',
            content: presentation,
          });

          draftContent = presentation;
        }
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(document.content, 'presentation'),
      prompt: description,
      schema: z.object({
        presentation: z.string().describe('Updated Markdown content for Spectacle presentation'),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { presentation } = object;

        if (presentation) {
          dataStream.writeData({
            type: 'presentation-delta',
            content: presentation,
          });

          draftContent = presentation;
        }
      }
    }

    return draftContent;
  },
}); 