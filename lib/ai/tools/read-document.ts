import type { DataStreamWriter } from 'ai';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { getDocumentById } from '@/lib/db/queries';
import { tool } from 'ai';

interface ReadDocumentProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const readDocument = ({ session, dataStream }: ReadDocumentProps) =>
  tool({
    description: 'Read the content of a document by its ID.',
    parameters: z.object({
      id: z.string().describe('The ID of the document to read'),
    }),
    execute: async ({ id }) => {
      const document = await getDocumentById({ id });

      if (!document) {
        return {
          error: 'Document not found',
        };
      }

      // Check if user has access to the document
      if (document.userId !== session.user?.id) {
        return {
          error: 'Unauthorized access to document',
        };
      }

      return {
        id: document.id,
        title: document.title,
        kind: document.kind,
        content: document.content,
        createdAt: document.createdAt,
      };
    },
  });
