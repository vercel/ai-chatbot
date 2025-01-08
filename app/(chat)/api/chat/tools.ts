import {
  type CoreTool,
  type DataStreamWriter,
  streamObject,
  streamText,
} from 'ai';
import { z } from 'zod';

import { customModel } from '@/lib/ai';
import type { Model } from '@/lib/ai/models';
import { codePrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import {
  getDocumentById,
  saveDocument,
  saveSuggestions,
} from '@/lib/db/queries';
import type { Suggestion } from '@/lib/db/schema';
import { generateUUID } from '@/lib/utils';
import type { Session } from 'next-auth';

export function createTools(
  session: Session,
  dataStream: DataStreamWriter,
  model: Model,
): Record<string, CoreTool> {
  return {
    getWeather: {
      description: 'Get the current weather at a location',
      parameters: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
      execute: async ({ latitude, longitude }) => {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
        );

        const weatherData = await response.json();
        return weatherData;
      },
    },
    createDocument: {
      description:
        'Create a document for a writing activity. This tool will call other functions that will generate the contents of the document based on the title and kind.',
      parameters: z.object({
        title: z.string(),
        kind: z.enum(['text', 'code']),
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
    },
    updateDocument: {
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
    },
    requestSuggestions: {
      description: 'Request suggestions for a document',
      parameters: z.object({
        documentId: z
          .string()
          .describe('The ID of the document to request edits'),
      }),
      execute: async ({ documentId }) => {
        const document = await getDocumentById({ id: documentId });

        if (!document || !document.content) {
          return {
            error: 'Document not found',
          };
        }

        const suggestions: Array<
          Omit<Suggestion, 'userId' | 'createdAt' | 'documentCreatedAt'>
        > = [];

        const { elementStream } = streamObject({
          model: customModel(model.apiIdentifier),
          system:
            'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
          prompt: document.content,
          output: 'array',
          schema: z.object({
            originalSentence: z.string().describe('The original sentence'),
            suggestedSentence: z.string().describe('The suggested sentence'),
            description: z
              .string()
              .describe('The description of the suggestion'),
          }),
        });

        for await (const element of elementStream) {
          const suggestion = {
            originalText: element.originalSentence,
            suggestedText: element.suggestedSentence,
            description: element.description,
            id: generateUUID(),
            documentId: documentId,
            isResolved: false,
          };

          dataStream.writeData({
            type: 'suggestion',
            content: suggestion,
          });

          suggestions.push(suggestion);
        }

        if (session.user?.id) {
          const userId = session.user.id;

          await saveSuggestions({
            suggestions: suggestions.map((suggestion) => ({
              ...suggestion,
              userId,
              createdAt: new Date(),
              documentCreatedAt: document.createdAt,
            })),
          });
        }

        return {
          id: documentId,
          title: document.title,
          kind: document.kind,
          message: 'Suggestions have been added to the document',
        };
      },
    },
  };
}
