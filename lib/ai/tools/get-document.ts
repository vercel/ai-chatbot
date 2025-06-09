/**
 * @file lib/ai/tools/get-document.ts
 * @description Инструмент для получения содержимого документа по его ID.
 * @version 1.4.0
 * @date 2025-06-09
 * @updated Внедрена Zod-валидация для documentId и полное структурированное логирование.
 */

/** HISTORY:
 * v1.4.0 (2025-06-09): Добавлена Zod-валидация и структурированное логирование.
 * v1.3.0 (2025-06-09): Внедрена система структурированного логирования.
 * v1.2.0 (2025-06-06): Возвращаем полный контент документа в результате.
 * v1.1.0 (2025-06-06): Добавлена поддержка версионирования.
 * v1.0.0 (2025-06-06): Начальная версия.
 */

import { tool } from 'ai'
import { z } from 'zod'
import { getDocumentById } from '@/lib/db/queries'
import { ChatSDKError } from '@/lib/errors'
import { createLogger } from '@fab33/sys-logger'

const logger = createLogger('lib:ai:tools:get-document')

export const getDocument = tool({
  description: 'Get the content of a document by its ID and optional version number. Use this tool when you need the full text or code of a document to answer a question or perform a task. If no version is specified, the latest version is returned.',
  parameters: z.object({
    documentId: z.string().uuid({ message: 'Invalid document ID. You must provide a valid UUID. The ID should be retrieved from the context or a previous tool call.' }).describe('The UUID of the document to retrieve.'),
    version: z.number().optional().describe('The specific version number of the document to retrieve. Starts from 1. If omitted, the latest version will be returned.'),
  }),
  execute: async (args) => {
    const childLogger = logger.child({ documentId: args.documentId, version: args.version })
    childLogger.trace('Entering getDocument tool')

    try {
      const { documentId, version } = args
      const result = await getDocumentById({ id: documentId, version })

      if (!result) {
        childLogger.warn('Document not found in DB')
        throw new ChatSDKError('not_found:database', 'Document not found.')
      }

      const { doc, totalVersions } = result
      const returnedVersionNumber = version ? version : totalVersions

      const finalResult = {
        id: doc.id,
        title: doc.title,
        kind: doc.kind,
        content: doc.content,
        currentVersion: returnedVersionNumber,
        totalVersions: totalVersions,
        authorId: doc.authorId,
        createdAt: doc.createdAt,
      }

      childLogger.info('Document retrieved successfully', { version: returnedVersionNumber, totalVersions })
      childLogger.trace({ result: finalResult }, 'Exiting getDocument tool')
      return finalResult

    } catch (error) {
      childLogger.error({ err: error as Error }, 'Failed to get document')
      if (error instanceof z.ZodError) {
        return { error: error.issues[0].message }
      }
      return { error: `Failed to retrieve document with ID ${args.documentId}.` }
    }
  },
})

// END OF: lib/ai/tools/get-document.ts
