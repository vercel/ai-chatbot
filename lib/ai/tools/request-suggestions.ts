import { z } from 'zod';
import { streamObject, tool } from 'ai';
import type { DataStreamWriter } from 'ai';
import { getDocumentById, saveSuggestions } from '@/lib/db/queries';
import type { Suggestion } from '@/lib/db/schema';
import { generateUUID } from '@/lib/utils';
import { myProvider } from '../providers';

interface RequestSuggestionsProps {
  userId: string;
  dataStream: DataStreamWriter;
}

export const requestSuggestions = ({
  userId,
  dataStream,
}: RequestSuggestionsProps) =>
  tool({
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
        model: myProvider.languageModel('artifact-model'),
        system:
          'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
        prompt: document.content,
        output: 'array',
        schema: z.object({
          originalSentence: z.string().describe('The original sentence'),
          suggestedSentence: z.string().describe('The suggested sentence'),
          description: z.string().describe('The description of the suggestion'),
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

      if (userId) {
        const suggestionsToSave = suggestions.map((suggestion) => ({
          ...suggestion,
          userId: userId,
          createdAt: new Date(),
          documentCreatedAt: document.createdAt,
        }));
        console.log(
          '[requestSuggestions] Attempting to save suggestions:',
          JSON.stringify(suggestionsToSave, null, 2),
        );

        if (
          !(document.createdAt instanceof Date) ||
          Number.isNaN(document.createdAt.getTime())
        ) {
          console.error(
            '[requestSuggestions] Error: Invalid document.createdAt:',
            document.createdAt,
          );
          throw new Error(
            'Invalid document creation date found when saving suggestions.',
          );
        }

        await saveSuggestions({
          suggestions: suggestionsToSave,
        });
      }

      return {
        id: documentId,
        title: document.title,
        kind: document.kind,
        message: 'Suggestions have been added to the document',
      };
    },
  });
