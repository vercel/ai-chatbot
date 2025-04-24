import { tool } from 'ai';
import type { DataStreamWriter } from 'ai';
// import type { User } from '@supabase/supabase-js'; // Remove Supabase User import
import { z } from 'zod';
import { getDocumentById, saveDocument } from '@/lib/db/queries';
import { documentHandlersByArtifactKind } from '@/lib/artifacts/server';

interface UpdateDocumentProps {
  // user: User; // Change user object to userId string (profile UUID)
  userId: string;
  dataStream: DataStreamWriter;
}

export const updateDocument = ({
  // user, // Destructure userId instead of user
  userId,
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

      // Ownership Check: Ensure the userId passed to the tool matches the document's userId
      if (document.userId !== userId) {
        console.warn(
          `Unauthorized attempt to update document ${id} by user ${userId}. Owner is ${document.userId}`,
        );
        // Return an error or throw, depending on desired behavior for tool errors
        return {
          error: 'Unauthorized',
        };
      }

      dataStream.writeData({
        type: 'clear',
        content: document.title, // Keep existing title initially
      });

      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === document.kind,
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${document.kind}`);
      }

      await documentHandler.onUpdateDocument({
        document,
        description,
        dataStream,
        // user, // Pass userId string
        userId: userId,
      });

      dataStream.writeData({ type: 'finish', content: '' });

      return {
        id,
        title: document.title,
        kind: document.kind,
        content: 'The document has been updated successfully.',
      };
    },
  });
