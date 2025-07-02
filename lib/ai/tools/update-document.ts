import { tool, type UIMessageStreamWriter } from 'ai';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { getDocumentById } from '@/lib/db/queries';
import { documentHandlersByKind } from '@/lib/artifacts/server';
import type { ChatMessage } from '@/lib/types';

interface UpdateDocumentProps {
  session: Session;
  streamWriter: UIMessageStreamWriter<ChatMessage>;
}

export const updateDocument = ({
  session,
  streamWriter,
}: UpdateDocumentProps) =>
  tool({
    description: 'Update a document with the given description.',
    inputSchema: z.object({
      id: z.string().describe('The ID of the document to update'),
      description: z
        .string()
        .describe('The description of changes that need to be made'),
    }),
    execute: async ({ id, description }, { toolCallId }) => {
      const document = await getDocumentById({ id });

      if (!document) {
        return {
          error: 'Document not found',
        };
      }

      streamWriter.write({
        id: toolCallId,
        type: 'data-document',
        data: {
          status: 'in_progress',
        },
      });

      const documentHandler = documentHandlersByKind.find(
        (documentHandlerByKind) => documentHandlerByKind.kind === document.kind,
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${document.kind}`);
      }

      await documentHandler.onUpdateDocument({
        document,
        description,
        streamWriter,
        session,
        toolCallId,
      });

      streamWriter.write({
        id: toolCallId,
        type: 'data-document',
        data: {
          status: 'completed',
        },
      });

      return {
        id,
        title: document.title,
        kind: document.kind,
        content: 'The document has been updated successfully.',
      };
    },
  });
