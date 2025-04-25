import { codeDocumentHandler } from '@/artifacts/code/server';
import { imageDocumentHandler } from '@/artifacts/image/server';
import { sheetDocumentHandler } from '@/artifacts/sheet/server';
import { textDocumentHandler } from '@/artifacts/text/server';
import type { ArtifactKind } from '@/components/artifact';
import type { DataStreamWriter } from 'ai';
import type { Document } from '../db/schema';
import { saveDocument } from '../db/queries';
import { revalidateTag } from 'next/cache';

export interface SaveDocumentProps {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}

export interface CreateDocumentCallbackProps {
  id: string;
  title: string;
  chatId: string;
  dataStream: DataStreamWriter;
  userId: string;
}

export interface UpdateDocumentCallbackProps {
  document: Document;
  description: string;
  dataStream: DataStreamWriter;
  userId: string;
}

export interface DocumentHandler<T = ArtifactKind> {
  kind: T;
  onCreateDocument: (args: CreateDocumentCallbackProps) => Promise<void>;
  onUpdateDocument: (args: UpdateDocumentCallbackProps) => Promise<void>;
}

export function createDocumentHandler<T extends ArtifactKind>(config: {
  kind: T;
  onCreateDocument: (params: {
    id: string;
    title: string;
    dataStream: DataStreamWriter;
    userId: string;
  }) => Promise<string>;
  onUpdateDocument: (params: {
    document: Document;
    description: string;
    dataStream: DataStreamWriter;
    userId: string;
  }) => Promise<string>;
}): DocumentHandler<T> {
  return {
    kind: config.kind,
    onCreateDocument: async (args: CreateDocumentCallbackProps) => {
      console.log(
        '[createDocumentHandler] onCreateDocument called with args:',
        args,
      );
      const draftContent = await config.onCreateDocument({
        id: args.id,
        title: args.title,
        dataStream: args.dataStream,
        userId: args.userId,
      });
      console.log(
        '[createDocumentHandler] draftContent received:',
        draftContent ? `${draftContent.substring(0, 30)}...` : null,
      );

      if (args.userId) {
        console.log(
          `[createDocumentHandler] Attempting saveDocument for id: ${args.id}, userId: ${args.userId}`,
        );
        try {
          await saveDocument({
            id: args.id,
            title: args.title,
            content: draftContent,
            kind: config.kind,
            userId: args.userId,
            chatId: args.chatId,
          });
          console.log(
            `[createDocumentHandler] saveDocument successful for id: ${args.id}`,
          );
          // Revalidate user history after creating a document
          revalidateTag(`history-${args.userId}`);
        } catch (error) {
          console.error(
            `[createDocumentHandler] saveDocument FAILED for id: ${args.id}:`,
            error,
          );
          // Revalidate user history after updating a document
          revalidateTag(`history-${args.userId}`);
          throw error;
        }
      } else {
        console.warn(
          '[createDocumentHandler] No userId provided, skipping saveDocument.',
        );
      }

      return;
    },
    onUpdateDocument: async (args: UpdateDocumentCallbackProps) => {
      console.log(
        '[createDocumentHandler] onUpdateDocument called with args:',
        args,
      );
      const draftContent = await config.onUpdateDocument({
        document: args.document,
        description: args.description,
        dataStream: args.dataStream,
        userId: args.userId,
      });
      console.log(
        '[createDocumentHandler] draftContent received for update:',
        draftContent ? `${draftContent.substring(0, 30)}...` : null,
      );

      if (args.userId) {
        console.log(
          `[createDocumentHandler] Attempting saveDocument update for id: ${args.document.id}, userId: ${args.userId}`,
        );
        try {
          await saveDocument({
            id: args.document.id,
            title: args.document.title,
            content: draftContent,
            kind: config.kind,
            userId: args.userId,
            chatId: args.document.chatId ?? undefined,
          });
          console.log(
            `[createDocumentHandler] saveDocument update successful for id: ${args.document.id}`,
          );
          // Revalidate user history after creating a document
          revalidateTag(`history-${args.userId}`);
        } catch (error) {
          console.error(
            `[createDocumentHandler] saveDocument update FAILED for id: ${args.document.id}:`,
            error,
          );
          // Revalidate user history after updating a document
          revalidateTag(`history-${args.userId}`);
          throw error;
        }
      } else {
        console.warn(
          '[createDocumentHandler] No userId provided, skipping saveDocument update.',
        );
      }

      return;
    },
  };
}

/*
 * Use this array to define the document handlers for each artifact kind.
 */
export const documentHandlersByArtifactKind: Array<DocumentHandler> = [
  textDocumentHandler,
  codeDocumentHandler,
  imageDocumentHandler,
  sheetDocumentHandler,
];

export const artifactKinds = ['text', 'code', 'image', 'sheet'] as const;
