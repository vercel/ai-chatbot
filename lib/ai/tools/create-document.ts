import { generateUUID } from '@/lib/utils';
import { tool, type UIMessageStreamWriter } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from '@/lib/artifacts/server';
import type { ChatMessage } from '@/lib/types';

interface CreateDocumentProps {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const createDocument = ({ session, dataStream }: CreateDocumentProps) =>
  tool({
    description:
      'Create a document for a writing or content creation activities. You can either provide pre-generated content or let the system generate content based on the title.',
    inputSchema: z.object({
      title: z.string(),
      kind: z.enum(artifactKinds),
      content: z.string().optional().describe('Pre-generated content for the document. If provided, this content will be used directly instead of generating new content.'),
    }),
    execute: async ({ title, kind, content }) => {
      const id = generateUUID();

      dataStream.write({
        type: 'data-kind',
        data: kind,
        transient: true,
      });

      dataStream.write({
        type: 'data-id',
        data: id,
        transient: true,
      });

      dataStream.write({
        type: 'data-title',
        data: title,
        transient: true,
      });

      dataStream.write({
        type: 'data-clear',
        data: null,
        transient: true,
      });

      if (content) {
        // If content is provided, stream it directly without using document handler
        const words = content.split(' ');
        for (const word of words) {
          dataStream.write({
            type: 'data-textDelta',
            data: word + ' ',
            transient: true,
          });
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Save the document directly
        if (session?.user?.id) {
          const { saveDocument } = await import('@/lib/db/queries');
          await saveDocument({
            id,
            title,
            content,
            kind,
            userId: session.user.id,
            organizationId: session.user.organizationId,
          });
        }
      } else {
        // Fallback to document handler for backward compatibility
        const documentHandler = documentHandlersByArtifactKind.find(
          (documentHandlerByArtifactKind) =>
            documentHandlerByArtifactKind.kind === kind,
        );

        if (!documentHandler) {
          throw new Error(`No document handler found for kind: ${kind}`);
        }

        await documentHandler.onCreateDocument({
          id,
          title,
          dataStream,
          session,
        });
      }

      dataStream.write({ type: 'data-finish', data: null, transient: true });

      return {
        id,
        title,
        kind,
        content: content || 'A document was created and is now visible to the user.',
      };
    },
  });
