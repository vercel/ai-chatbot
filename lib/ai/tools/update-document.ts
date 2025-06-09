/**
 * @file lib/ai/tools/update-document.ts
 * @description Инструмент для обновления существующего документа.
 * @version 2.0.0
 * @date 2025-06-09
 * @updated Добавлена Zod-валидация на входе для проверки формата UUID и улучшено описание инструмента.
 */

/**
 * HISTORY:
 * v2.0.0 (2025-06-09): Добавлена входная валидация параметров. Инструмент теперь возвращает ошибку, если ID не является валидным UUID. Улучшены описания для AI.
 * v1.0.0 (2025-06-06): Исправлена ошибка доступа к свойствам документа после изменения структуры getDocumentById.
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
    description: 'Update an existing document, such as an essay, code, or image, using a text description of the desired changes. You must provide the document\'s unique UUID.',
    parameters: z.object({
      id: z.string().describe('The UUID of the document to update. This ID must be obtained from a previous tool call that created or retrieved the document.'),
      description: z
        .string()
        .describe('A detailed text description of the changes to be made to the document.'),
    }),
    execute: async (args) => {
      // --- Входная валидация ---
      const validationSchema = z.object({
        id: z.string().uuid({ message: 'Invalid document ID. Please provide a valid UUID. You can find the ID in the result of the tool that created the document.' }),
        description: z.string(),
      })

      try {
        validationSchema.parse(args)
      } catch (error) {
        // Возвращаем ошибку модели, чтобы она могла исправиться
        return { error: (error as z.ZodError).issues[0].message }
      }

      const { id, description } = args
      // --- Конец валидации ---

      const documentResult = await getDocumentById({ id })

      if (!documentResult) {
        return { error: `Document with ID '${id}' not found.` }
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
