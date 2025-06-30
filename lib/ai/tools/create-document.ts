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
  streamWriter: UIMessageStreamWriter<ChatMessage>;
}

export const createDocument = ({
  session,
  streamWriter,
}: CreateDocumentProps) =>
  tool({
    description:
      'Create a document for a writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind.',
    inputSchema: z.object({
      title: z.string(),
      kind: z.enum(artifactKinds),
    }),
    execute: async ({ title, kind }) => {
      const documentId = generateUUID();

      streamWriter.write({
        type: 'data-document',
        id: '1',
        data: {
          kind,
          status: 'in_progress',
        },
      });

      streamWriter.write({
        type: 'data-document',
        id: '1',
        data: {
          id: documentId,
        },
      });

      streamWriter.write({
        type: 'data-document',
        id: '1',
        data: {
          title,
        },
      });

      streamWriter.write({
        type: 'data-document',
        id: '1',
        data: {
          content: '',
        },
      });

      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === kind,
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${kind}`);
      }

      await documentHandler.onCreateDocument({
        id: documentId,
        title,
        streamWriter,
        session,
      });

      return `A ${kind} document of id ${documentId} and title "${title}" was created and is now visible to the user.`;
    },
  });
