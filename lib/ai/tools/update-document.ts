import {
  DataStreamWriter,
  experimental_generateImage,
  smoothStream,
  streamObject,
  streamText,
  tool,
} from 'ai';
import { Session } from 'next-auth';
import { z } from 'zod';
import { getDocumentById, saveDocument } from '@/lib/db/queries';
import { updateDocumentPrompt } from '../prompts';
import { myProvider } from '../models';

interface UpdateDocumentProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const updateDocument = ({ session, dataStream }: UpdateDocumentProps) =>
  tool({
    description: 'Update a document with the given description.',
    parameters: z.object({
      id: z.string().describe('The ID of the document to update'),
      description: z
        .string()
        .describe('The description of changes that need to be made'),
    }),
    execute: async ({ id, description }) => {
      const document = await getDocumentById({ id });

      if (!document) {
        return {
          error: 'Document not found',
        };
      }

      const { content: currentContent } = document;
      let draftText = '';

      dataStream.writeData({
        type: 'clear',
        content: document.title,
      });

      if (document.kind === 'text') {
        const { fullStream } = streamText({
          model: myProvider.languageModel('block-model'),
          system: updateDocumentPrompt(currentContent, 'text'),
          experimental_transform: smoothStream({ chunking: 'word' }),
          prompt: description,
          experimental_providerMetadata: {
            openai: {
              prediction: {
                type: 'content',
                content: currentContent,
              },
            },
          },
        });

        for await (const delta of fullStream) {
          const { type } = delta;

          if (type === 'text-delta') {
            const { textDelta } = delta;

            draftText += textDelta;
            dataStream.writeData({
              type: 'text-delta',
              content: textDelta,
            });
          }
        }

        dataStream.writeData({ type: 'finish', content: '' });
      } else if (document.kind === 'code') {
        const { fullStream } = streamObject({
          model: myProvider.languageModel('block-model'),
          system: updateDocumentPrompt(currentContent, 'code'),
          prompt: description,
          schema: z.object({
            code: z.string(),
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
                content: code ?? '',
              });

              draftText = code;
            }
          }
        }

        dataStream.writeData({ type: 'finish', content: '' });
      } else if (document.kind === 'image') {
        const { image } = await experimental_generateImage({
          model: myProvider.imageModel('image-model'),
          prompt: description,
          n: 1,
        });

        draftText = image.base64;

        dataStream.writeData({
          type: 'image-delta',
          content: image.base64,
        });

        dataStream.writeData({ type: 'finish', content: '' });
      } else if (document.kind === 'sheet') {
        const { fullStream } = streamObject({
          model: myProvider.languageModel('block-model'),
          system: updateDocumentPrompt(currentContent, 'sheet'),
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

              draftText = csv;
            }
          }
        }

        dataStream.writeData({ type: 'finish', content: '' });
      }

      if (session.user?.id) {
        await saveDocument({
          id,
          title: document.title,
          content: draftText,
          kind: document.kind,
          userId: session.user.id,
        });
      }

      return {
        id,
        title: document.title,
        kind: document.kind,
        content: 'The document has been updated successfully.',
      };
    },
  });
