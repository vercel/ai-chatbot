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
      kind: z.enum(['text', 'code', 'image', 'sheet']),
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
      } else if (kind === 'sheet') {
        const { fullStream } = streamObject({
          model: customModel(model.apiIdentifier),
          system: `You are a spreadsheet initialization assistant. Create a spreadsheet structure based on the title/description and the chat history.
            - Create meaningful column headers based on the context and chat history
            - Keep data types consistent within columns
            - If the title doesn't suggest specific columns, create a general-purpose structure`,
          prompt: title,
          schema: z.object({
            headers: z
              .array(z.string())
              .describe('Column headers for the spreadsheet'),
            rows: z.array(z.array(z.string())).describe('Data rows'),
          }),
        });

        let spreadsheetData: { headers: string[]; rows: string[][] } = {
          headers: [],
          rows: [[], []],
        };

        for await (const delta of fullStream) {
          const { type } = delta;

          if (type === 'object') {
            const { object } = delta;
            if (
              object &&
              Array.isArray(object.headers) &&
              Array.isArray(object.rows)
            ) {
              // Validate and normalize the data
              const headers = object.headers.map((h) => String(h || ''));
              const rows = object.rows.map((row) => {
                // Handle undefined row by creating empty array
                const safeRow = (row || []).map((cell) => String(cell || ''));
                // Ensure row length matches headers
                while (safeRow.length < headers.length) safeRow.push('');
                return safeRow.slice(0, headers.length);
              });

              spreadsheetData = { headers, rows };
            }
          }
        }

        draftText = JSON.stringify(spreadsheetData);
        dataStream.writeData({
          type: 'spreadsheet-delta',
          content: draftText,
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
