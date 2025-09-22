import { z } from 'zod/v4';
import OpenAI from 'openai';
import { tool } from 'ai';
import type { Session } from '@/lib/types';
import { getVectorStoreFileForUser } from '@/lib/db/queries';

const OPENAI_BETA_HEADER = { 'OpenAI-Beta': 'assistants=v2' } as const;

interface GetFileContentsProps {
  session: Session;
  userId: string;
  vectorStoreId: string;
}

export const getFileContents = ({
  session,
  userId,
  vectorStoreId,
}: GetFileContentsProps) =>
  tool({
    description:
      'Retrieves the full parsed contents of a knowledge file previously uploaded to this agent’s vector store.',
    inputSchema: z.object({
      file_id: z
        .string()
        .min(1, 'file_id is required')
        .describe(
          'The vector store file ID returned when listing knowledge files.',
        ),
    }),
    execute: async ({ file_id }) => {
      if (!session?.user?.email) {
        return {
          error: 'Access denied: Missing session context.',
        };
      }

      if (!vectorStoreId) {
        return {
          error: 'No vector store is associated with this agent.',
        };
      }

      try {
        const fileRecord = await getVectorStoreFileForUser({
          userId,
          vectorStoreId,
          vectorStoreFileId: file_id,
        });

        if (!fileRecord) {
          return {
            error:
              'File not found in this knowledge base or you do not have access to it.',
          };
        }

        const apiKey =
          process.env.OPENAI_API_KEY ?? process.env.AI_GATEWAY_API_KEY ?? '';

        if (!apiKey) {
          return {
            error: 'OpenAI credentials are not configured on the server.',
          };
        }

        const openai = new OpenAI({ apiKey });

        const contentIterator = openai.vectorStores.files.content(
          file_id,
          { vector_store_id: vectorStoreId },
          { headers: OPENAI_BETA_HEADER },
        );

        const rawParts: Array<{ type?: string; text?: string }> = [];

        for await (const part of contentIterator) {
          rawParts.push(part as { type?: string; text?: string });
        }

        const combinedText = rawParts
          .map((part) => (typeof part.text === 'string' ? part.text : ''))
          .filter((text) => text.length > 0)
          .join('\n\n');

        return {
          file_id,
          file_name: fileRecord.fileName,
          file_size_bytes: fileRecord.fileSizeBytes ?? null,
          content_snippet: combinedText.slice(0, 1500),
          content_text: combinedText,
          content_parts: rawParts,
          instructions:
            'Use the relevant sections from this file responsibly. When you only need targeted snippets, prefer the file_search tool.',
        };
      } catch (error) {
        console.error('get_file_contents tool error:', error);
        return {
          error: 'Failed to retrieve file contents from the vector store.',
        };
      }
    },
  });
