import { generateUUID } from '@/lib/utils';
import {
  DataStreamWriter,
  experimental_generateImage,
  smoothStream,
  streamObject,
  streamText,
  tool,
} from 'ai';
import { z } from 'zod';
import { customModel, imageGenerationModel } from '..';
import { codePrompt } from '../prompts';
import { saveDocument } from '@/lib/db/queries';
import { Session } from 'next-auth';
import { Model } from '../models';

interface CreateDocumentProps {
  model: Model;
  session: Session;
  dataStream: DataStreamWriter;
}

export const createDocument = ({
  model,
  session,
  dataStream,
}: CreateDocumentProps) =>
  tool({
    description:
      'Create a document for a writing or content creation activities like image generation. This tool will call other functions that will generate the contents of the document based on the title and kind.',
    parameters: z.object({
      title: z.string(),
      kind: z.enum(['text', 'code', 'image']),
    }),
    execute: async ({ title, kind }) => {
      const id = generateUUID();
      let draftText = '';

      dataStream.writeData({
        type: 'id',
        content: id,
      });

      dataStream.writeData({
        type: 'title',
        content: title,
      });

      dataStream.writeData({
        type: 'kind',
        content: kind,
      });

      dataStream.writeData({
        type: 'clear',
        content: '',
      });

      if (kind === 'text') {
        const { fullStream } = streamText({
          model: customModel(model.apiIdentifier),
          system:
            'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
          experimental_transform: smoothStream({ chunking: 'word' }),
          prompt: title,
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
      } else if (kind === 'code') {
        const { fullStream } = streamObject({
          model: customModel(model.apiIdentifier),
          system: codePrompt,
          prompt: title,
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
      } else if (kind === 'image') {
        const { image } = await experimental_generateImage({
          model: imageGenerationModel,
          prompt: title,
          n: 1,
        });

        draftText = image.base64;

        dataStream.writeData({
          type: 'image-delta',
          content: image.base64,
        });

        dataStream.writeData({ type: 'finish', content: '' });
      }

      if (session.user?.id) {
        await saveDocument({
          id,
          title,
          kind,
          content: draftText,
          userId: session.user.id,
        });
      }

      return {
        id,
        title,
        kind,
        content: 'A document was created and is now visible to the user.',
      };
    },
  });
