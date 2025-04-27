import { tool } from 'ai';
import type { DataStreamWriter } from 'ai';
// import type { User } from '@supabase/supabase-js'; // Remove Supabase User import
import { z } from 'zod';
import { getDocumentById, saveDocument } from '@/lib/db/queries';
import { documentHandlersByArtifactKind } from '@/lib/artifacts/server';
import type { Document } from '@/lib/db/schema'; // Import the Document type

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
      console.log(`[updateDocument tool] Executing for ID: ${id}`); // Log start
      let document: Document | undefined;
      try {
        console.log(
          `[updateDocument tool] Calling getDocumentById for ID: ${id}`,
        );
        document = await getDocumentById({ id });
        console.log(
          `[updateDocument tool] getDocumentById returned: ${document ? 'Document found' : 'Not found'}`,
        );
      } catch (error) {
        console.error(
          `[updateDocument tool] Error calling getDocumentById for ID: ${id}`,
          error,
        );
        return { error: 'Failed to fetch document' }; // Return error if DB fails
      }

      if (!document) {
        console.error(`[updateDocument tool] Document not found for ID: ${id}`);
        return {
          error: 'Document not found',
        };
      }

      // Ownership Check:
      console.log(
        `[updateDocument tool] Checking ownership for user: ${userId}`,
      );
      if (document.userId !== userId) {
        console.warn(
          `[updateDocument tool] Unauthorized attempt to update document ${id} by user ${userId}. Owner is ${document.userId}`,
        );
        return {
          error: 'Unauthorized',
        };
      }
      console.log(`[updateDocument tool] Ownership verified.`);

      dataStream.writeData({
        type: 'clear',
        content: document.title,
      });

      console.log(
        `[updateDocument tool] Looking for handler for kind: ${document.kind}`,
      );
      const documentHandler = documentHandlersByArtifactKind.find(
        (handler) => handler.kind === document.kind,
      );

      if (!documentHandler) {
        console.error(
          `[updateDocument tool] No document handler found for kind: ${document.kind}`,
        );
        // Throwing an error here might be better to signal a system issue
        throw new Error(`No document handler found for kind: ${document.kind}`);
      }
      console.log(
        `[updateDocument tool] Found handler for kind: ${document.kind}`,
      );

      try {
        console.log(
          `[updateDocument tool] Calling documentHandler.onUpdateDocument for ID: ${id}`,
        );
        await documentHandler.onUpdateDocument({
          document,
          description,
          dataStream,
          userId: userId,
        });
        console.log(
          `[updateDocument tool] documentHandler.onUpdateDocument finished for ID: ${id}`,
        );
      } catch (error) {
        console.error(
          `[updateDocument tool] Error calling onUpdateDocument for ID: ${id}`,
          error,
        );
        // Decide how to handle handler errors - maybe return an error object?
        return { error: 'Failed to execute document update handler' };
      }

      dataStream.writeData({ type: 'finish', content: '' });

      console.log(
        `[updateDocument tool] Successfully finished execution for ID: ${id}`,
      );
      return {
        id,
        title: document.title,
        kind: document.kind,
        content: 'The document has been updated successfully.',
      };
    },
  });
