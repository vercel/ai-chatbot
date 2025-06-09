/**
 * @file lib/ai/tools/update-document.ts
 * @description Инструмент для обновления существующего документа.
 * @version 2.6.0
 * @date 2025-06-09
 * @updated Инструмент теперь вызывает обработчик, который возвращает обновленный контент, и затем возвращает результат.
 */

/**
 * HISTORY:
 * v2.6.0 (2025-06-09): Переход на архитектуру "черного ящика".
 * v2.5.0 (2025-06-09): Очистка кода от `dataStream`.
 * v2.4.0 (2025-06-09): Очистка кода от @ts-ignore.
 */

import { tool } from 'ai'
import type { Session } from 'next-auth'
import { z } from 'zod'
import { getDocumentById, } from '@/lib/db/queries'
import { documentHandlersByArtifactKind } from '@/lib/artifacts/server'
import { createLogger } from '@fab33/sys-logger'

const logger = createLogger('lib:ai:tools:update-document')

interface UpdateDocumentProps {
  session: Session;
}

export const updateDocument = ({ session }: UpdateDocumentProps) =>
  tool({
    description: 'Update an existing document, such as an essay, code, or image, using a text description of the desired changes. You must provide the document\'s unique UUID.',
    parameters: z.object({
      id: z.string().describe('The UUID of the document to update. This ID must be obtained from a previous tool call that created or retrieved the document.'),
      description: z
        .string()
        .describe('A detailed text description of the changes to be made to the document.'),
    }),
    execute: async (args) => {
      const childLogger = logger.child({ documentId: args.id, userId: session.user?.id })
      childLogger.trace({ description: args.description }, 'Entering updateDocument tool')

      const validationSchema = z.object({
        id: z.string().uuid({ message: 'Invalid document ID. Please provide a valid UUID. You can find the ID in the result of the tool that created the document.' }),
        description: z.string(),
      })

      try {
        validationSchema.parse(args)
      } catch (error) {
        childLogger.warn({ err: error }, 'Validation failed for updateDocument arguments')
        return { error: (error as z.ZodError).issues[0].message }
      }

      const { id, description } = args

      const documentResult = await getDocumentById({ id })

      if (!documentResult) {
        childLogger.warn('Document not found')
        return { error: `Document with ID '${id}' not found.` }
      }

      const document = documentResult.doc

      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === document.kind,
      )

      if (!documentHandler) {
        childLogger.error({ kind: document.kind }, 'No document handler found for kind')
        throw new Error(`No document handler found for kind: ${document.kind}`)
      }

      childLogger.info('Executing document handler for update')
      await documentHandler.onUpdateDocument({
        document,
        description,
        session,
      })

      const result = {
        id,
        title: document.title,
        kind: document.kind,
        content: 'The document has been updated successfully.',
      }
      childLogger.trace({ result }, 'Exiting updateDocument tool')
      return result
    },
  })

// END OF: lib/ai/tools/update-document.ts
