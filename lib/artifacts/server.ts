import { codeDocumentHandler } from '@/artifacts/code/server';
import { imageDocumentHandler } from '@/artifacts/image/server';
import { sheetDocumentHandler } from '@/artifacts/sheet/server';
import { textDocumentHandler } from '@/artifacts/text/server';
import { textV2DocumentHandler } from '@/artifacts/textv2/server';
import type { ArtifactKind } from '@/components/artifact';
import type { DataStreamWriter } from 'ai';
import type { Document } from '../db/schema';
import { saveDocument } from '../db/queries';
import { revalidateTag } from 'next/cache';
import type { JSONContent } from '@tiptap/react';

export interface SaveDocumentProps {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string | null;
  content_json?: JSONContent | null;
  userId: string;
  chatId?: string;
  createdAt: Date;
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
  }) => Promise<string | object>;
  onUpdateDocument: (params: {
    document: Document;
    description: string;
    dataStream: DataStreamWriter;
    userId: string;
  }) => Promise<string | object>;
}): DocumentHandler<T> {
  return {
    kind: config.kind,
    onCreateDocument: async (args: CreateDocumentCallbackProps) => {
      console.log(
        '[createDocumentHandler] onCreateDocument called with args:',
        args,
      );
      const draftResult = await config.onCreateDocument({
        id: args.id,
        title: args.title,
        dataStream: args.dataStream,
        userId: args.userId,
      });
      console.log(
        '[createDocumentHandler] draftResult received:',
        typeof draftResult === 'string'
          ? `${draftResult.substring(0, 30)}...`
          : '[Object Content]',
      );

      if (args.userId) {
        console.log(
          `[createDocumentHandler] Attempting saveDocument for id: ${args.id}, userId: ${args.userId}`,
        );
        try {
          let contentToSave: string | null = null;
          let contentJsonToSave: JSONContent | null = null;

          if (config.kind === 'textv2' && typeof draftResult === 'object') {
            contentToSave = (draftResult as any).markdown ?? '';
            contentJsonToSave = (draftResult as any).json ?? null;
          } else if (typeof draftResult === 'string') {
            contentToSave = draftResult;
            contentJsonToSave = null;
          } else {
            console.warn(
              '[createDocumentHandler] Unexpected draftResult type:',
              typeof draftResult,
            );
            contentToSave = '';
            contentJsonToSave = null;
          }

          const saveProps: SaveDocumentProps = {
            id: args.id,
            title: args.title,
            kind: config.kind,
            userId: args.userId,
            chatId: args.chatId ?? undefined,
            createdAt: new Date(),
            content: contentToSave,
            content_json: contentJsonToSave,
          };

          console.log('Saving document with values:', saveProps);

          await saveDocument(saveProps);

          console.log(
            `[createDocumentHandler] saveDocument successful for id: ${args.id}`,
          );

          revalidateTag(`history-${args.userId}`);
        } catch (error) {
          console.error(
            `[createDocumentHandler] saveDocument FAILED for id: ${args.id}:`,
            error,
          );
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
      const draftResult = await config.onUpdateDocument({
        document: args.document,
        description: args.description,
        dataStream: args.dataStream,
        userId: args.userId,
      });
      console.log(
        '[createDocumentHandler] draftResult received for update:',
        typeof draftResult === 'string'
          ? `${draftResult.substring(0, 30)}...`
          : '[Object Content]',
      );

      if (args.userId) {
        console.log(
          `[createDocumentHandler] Attempting saveDocument update for id: ${args.document.id}, userId: ${args.userId}`,
        );
        try {
          let contentToSave: string | null = null;
          let contentJsonToSave: JSONContent | null = null;

          if (config.kind === 'textv2' && typeof draftResult === 'object') {
            contentToSave = (draftResult as any).markdown ?? '';
            contentJsonToSave = (draftResult as any).json ?? null;
          } else if (typeof draftResult === 'string') {
            contentToSave = draftResult;
            contentJsonToSave = null;
          } else {
            console.warn(
              '[createDocumentHandler] Unexpected draftResult type for update:',
              typeof draftResult,
            );
            contentToSave = '';
            contentJsonToSave = null;
          }

          const saveProps: SaveDocumentProps = {
            id: args.document.id,
            title: args.document.title,
            kind: config.kind,
            userId: args.userId,
            chatId: args.document.chatId ?? undefined,
            createdAt: args.document.createdAt,
            content: contentToSave,
            content_json: contentJsonToSave,
          };

          console.log('Saving document update with values:', saveProps);

          await saveDocument(saveProps);

          console.log(
            `[createDocumentHandler] saveDocument update successful for id: ${args.document.id}`,
          );

          revalidateTag(`history-${args.userId}`);
        } catch (error) {
          console.error(
            `[createDocumentHandler] saveDocument update FAILED for id: ${args.document.id}:`,
            error,
          );
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
  textV2DocumentHandler,
  codeDocumentHandler,
  imageDocumentHandler,
  sheetDocumentHandler,
];

export const artifactKinds = [
  'text',
  'code',
  'image',
  'sheet',
  'textv2',
] as const;
