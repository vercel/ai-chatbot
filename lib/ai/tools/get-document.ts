/**
 * @file lib/ai/tools/get-document.ts
 * @description Инструмент для получения содержимого документа по его ID.
 * @version 1.1.0
 * @date 2025-06-06
 * @updated Добавлена поддержка версионирования и возвращаются расширенные метаданные.
 */

/** HISTORY:
 * v1.1.0 (2025-06-06): Добавлена поддержка версионирования.
 * v1.0.0 (2025-06-06): Начальная версия.
 *
 * @idea На будущее: можно добавить в возвращаемый объект массив с метаданными о последних N версиях (автор, дата),
 * чтобы дать LLM еще больше контекста о недавней активности. Это может быть полезно для более сложных запросов
 * на сравнение или откат изменений.
 */

import { tool } from 'ai'
import { z } from 'zod'
import { getDocumentById } from '@/lib/db/queries'
import { ChatSDKError } from '@/lib/errors'

export const getDocument = tool({
  description: 'Get the content of a document by its ID and optional version number. Use this tool when you need the full text or code of a document to answer a question or perform a task. If no version is specified, the latest version is returned.',
  parameters: z.object({
    documentId: z.string().describe('The ID of the document to retrieve.'),
    version: z.number().optional().describe('The specific version number of the document to retrieve. Starts from 1. If omitted, the latest version will be returned.'),
  }),
  execute: async ({ documentId, version }) => {
    try {
      const result = await getDocumentById({ id: documentId, version })
      if (!result) {
        throw new ChatSDKError('not_found:database', 'Document not found.')
      }

      const { doc, totalVersions } = result;

      // Определяем номер возвращенной версии
      const returnedVersionNumber = version ? version : totalVersions;

      return {
        id: doc.id,
        title: doc.title,
        kind: doc.kind,
        content: doc.content,
        currentVersion: returnedVersionNumber,
        totalVersions: totalVersions,
        authorId: doc.authorId,
        createdAt: doc.createdAt,
      }
    } catch (error) {
      console.error(`SYS_TOOL_GET_DOCUMENT: Failed to get document ${documentId}`, error)
      return { error: `Failed to retrieve document with ID ${documentId}.` }
    }
  },
})

// END OF: lib/ai/tools/get-document.ts
