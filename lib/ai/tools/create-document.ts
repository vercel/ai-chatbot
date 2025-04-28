import { generateUUID } from '@/lib/utils';
import { type DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from '@/lib/artifacts/server';

interface CreateDocumentProps {
  userId: string;
  dataStream: DataStreamWriter;
  chatId: string;
}

export const createDocument = ({
  userId,
  dataStream,
  chatId,
}: CreateDocumentProps) =>
  tool({
    description:
      "Create a document for a writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind. If the user specifies instructions (e.g., length, style, format), extract them and pass them in the 'instructions' parameter.",
    parameters: z.object({
      title: z.string(),
      kind: z.enum(artifactKinds),
      instructions: z
        .string()
        .optional()
        .describe(
          'Specific user instructions like length, style, format, etc., extracted from the user query.',
        ),
    }),
    execute: async ({ title, kind, instructions }) => {
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

      await documentHandler.onCreateDocument({
        id,
        title,
        chatId,
        dataStream,
        userId: userId,
        instructions,
      });

      dataStream.writeData({ type: 'finish', content: '' });

      return {
        id,
        title,
        kind,
        content: 'A document was created and is now visible to the user.',
      };
    },
  });
