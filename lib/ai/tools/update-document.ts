import {
  DataStreamWriter,
  experimental_generateImage,
  smoothStream,
  streamObject,
  streamText,
  tool,
} from 'ai';
import { Model } from '../models';
import { Session } from 'next-auth';
import { z } from 'zod';
import { getDocumentById, saveDocument } from '@/lib/db/queries';
import { customModel, imageGenerationModel } from '..';
import { updateDocumentPrompt } from '../prompts';

interface UpdateDocumentProps {
  model: Model;
  session: Session;
  dataStream: DataStreamWriter;
}

export const updateDocument = ({
  model,
  session,
  dataStream,
}: UpdateDocumentProps) =>
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
          model: customModel(model.apiIdentifier),
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
          model: customModel(model.apiIdentifier),
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
          model: imageGenerationModel,
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
        // Parse the current content as spreadsheet data
        let currentSpreadsheetData = { headers: [], rows: [] };
        try {
          if (currentContent) {
            currentSpreadsheetData = JSON.parse(currentContent);
          }
        } catch {
          // Keep default empty structure
        }

        const { fullStream } = streamObject({
          model: customModel(model.apiIdentifier),
          system: `You are a spreadsheet manipulation assistant. The current spreadsheet has the following structure:
            Headers: ${JSON.stringify(currentSpreadsheetData.headers)}
            Current rows: ${JSON.stringify(currentSpreadsheetData.rows)}

            When modifying the spreadsheet:
            1. You can add, remove, or modify columns (headers)
            2. When adding columns, add empty values to existing rows for the new columns
            3. When removing columns, remove the corresponding values from all rows
            4. Return the COMPLETE spreadsheet data including ALL headers and rows
            5. Format response as valid JSON with 'headers' and 'rows' arrays

            Example response format:
            {"headers":["Name","Email","Phone"],"rows":[["John","john@example.com","123-456-7890"],["Jane","jane@example.com","098-765-4321"]]}`,
          prompt: description,
          schema: z.object({
            headers: z
              .array(z.string())
              .describe('Column headers for the spreadsheet'),
            rows: z.array(z.array(z.string())).describe('Sample data rows'),
          }),
        });

        draftText = JSON.stringify(currentSpreadsheetData);

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
              const headers = object.headers.map((h: any) => String(h || ''));
              const rows = object.rows.map(
                (row: (string | undefined)[] | undefined) => {
                  const normalizedRow = (row || []).map((cell: any) =>
                    String(cell || ''),
                  );
                  // Ensure row length matches new headers length
                  while (normalizedRow.length < headers.length) {
                    normalizedRow.push('');
                  }
                  return normalizedRow.slice(0, headers.length);
                },
              );

              const newData = { headers, rows };
              draftText = JSON.stringify(newData);
              dataStream.writeData({
                type: 'spreadsheet-delta',
                content: draftText,
              });
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
