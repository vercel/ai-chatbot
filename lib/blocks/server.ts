import { codeDocumentHandler } from '@/blocks/code/server';
import { imageDocumentHandler } from '@/blocks/image/server';
import { sheetDocumentHandler } from '@/blocks/sheet/server';
import { textDocumentHandler } from '@/blocks/text/server';
import { BlockKind } from '@/components/block';
import { DataStreamWriter } from 'ai';
import { Document } from '../db/schema';
import { saveDocument } from '../db/queries';
import { Session } from 'next-auth';

export interface SaveDocumentProps {
  id: string;
  title: string;
  kind: BlockKind;
  content: string;
  userId: string;
}

export interface CreateDocumentCallbackProps {
  id: string;
  title: string;
  dataStream: DataStreamWriter;
  session: Session;
}

export interface UpdateDocumentCallbackProps {
  document: Document;
  description: string;
  dataStream: DataStreamWriter;
  session: Session;
}

export interface DocumentHandler<T = BlockKind> {
  kind: T;
  onCreateDocument: (args: CreateDocumentCallbackProps) => Promise<void>;
  onUpdateDocument: (args: UpdateDocumentCallbackProps) => Promise<void>;
}

export function createDocumentHandler<T extends BlockKind>(config: {
  kind: T;
  onCreateDocument: (params: CreateDocumentCallbackProps) => Promise<string>;
  onUpdateDocument: (params: UpdateDocumentCallbackProps) => Promise<string>;
}): DocumentHandler<T> {
  return {
    kind: config.kind,
    onCreateDocument: async (args: CreateDocumentCallbackProps) => {
      const draftContent = await config.onCreateDocument({
        id: args.id,
        title: args.title,
        dataStream: args.dataStream,
        session: args.session,
      });

      if (args.session?.user?.id) {
        await saveDocument({
          id: args.id,
          title: args.title,
          content: draftContent,
          kind: config.kind,
          userId: args.session.user.id,
        });
      }

      return;
    },
    onUpdateDocument: async (args: UpdateDocumentCallbackProps) => {
      const draftContent = await config.onUpdateDocument({
        document: args.document,
        description: args.description,
        dataStream: args.dataStream,
        session: args.session,
      });

      if (args.session?.user?.id) {
        await saveDocument({
          id: args.document.id,
          title: args.document.title,
          content: draftContent,
          kind: config.kind,
          userId: args.session.user.id,
        });
      }

      return;
    },
  };
}

/*
 * Use this array to define the document handlers for each block kind.
 */
export const documentHandlersByBlockKind: Array<DocumentHandler> = [
  textDocumentHandler,
  codeDocumentHandler,
  imageDocumentHandler,
  sheetDocumentHandler,
];

export const blockKinds = ['text', 'code', 'image', 'sheet'] as const;
