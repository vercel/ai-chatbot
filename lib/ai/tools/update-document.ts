/**
 * @file lib/ai/tools/update-document.ts
 * @description Инструмент для обновления документа.
 * @version 1.0.0
 * @date 2025-06-06
 * @updated Исправлена ошибка доступа к свойствам документа после изменения структуры getDocumentById.
 */
import { type DataStreamWriter, tool } from 'ai'
import type { Session } from 'next-auth'
import { z } from 'zod'
import { getDocumentById, } from '@/lib/db/queries'
import { documentHandlersByArtifactKind } from '@/lib/artifacts/server'

interface UpdateDocumentProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const updateDocument = ({ session, dataStream }: UpdateDocumentProps) =>
  tool({
    description: 'Update a document with the given description.',
    parameters: z.object({
      id: z.string().describe('The ID of the document to update'),
      description: z
        .string()
        .describe('The description of changes that need to be made'),
    }),
    execute: async ({ id, description }) => {
      const documentResult = await getDocumentById({ id })

      if (!documentResult) {
        return {
          error: 'Document not found',
        }
      }

      const document = documentResult.doc

      dataStream.writeData({
        type: 'clear',
        content: document.title,
      })

      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === document.kind,
      )

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${document.kind}`)
      }

      await documentHandler.onUpdateDocument({
        document,
        description,
        dataStream,
        session,
      })

      dataStream.writeData({ type: 'finish', content: '' })

      return {
        id,
        title: document.title,
        kind: document.kind,
        content: 'The document has been updated successfully.',
      }
    },
  })
// END OF: lib/ai/tools/update-document.ts
