import { generateUUID } from '@/lib/utils';
import { type DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from '@/lib/artifacts/server';

interface CreateDocumentProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const createDocument = ({ session, dataStream }: CreateDocumentProps) =>
  tool({
    description:
      "Create a document for writing or content creation activities. The title should be derived from and relevant to the user's initial request. If there are previous messages or tool results available, use those as initial content to ensure consistency. This tool will call other functions that will generate the contents of the document based on the title, kind, and any provided initial content.",
    parameters: z.object({
      title: z.string(),
      kind: z.enum(artifactKinds),
      initialContent: z
        .string()
        .optional()
        .describe(
          'If there are tool results available, use those as the initial content to ensure consistency.',
        ),
    }),
    execute: async ({ title, kind, initialContent }) => {
      const id = generateUUID();

      dataStream.writeData({
        type: 'kind',
        content: kind,
      });

      dataStream.writeData({
        type: 'id',
        content: id,
      });

      dataStream.writeData({
        type: 'title',
        content: title,
      });

      dataStream.writeData({
        type: 'clear',
        content: '',
      });

      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === kind,
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${kind}`);
      }

      const draftContent = await documentHandler.onCreateDocument({
        id,
        title,
        dataStream,
        session,
        initialContent,
      });

      dataStream.writeData({ type: 'finish', content: '' });

      return {
        id,
        title,
        kind,
        content: 'Document created successfully.',
        documentContent: draftContent,
      };
    },
  });
