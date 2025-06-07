/**
 * @file lib/ai/tools/get-document.ts
 * @description Инструмент для получения содержимого документа по его ID.
 * @version 1.2.0
 * @date 2025-06-06
 * @updated Инструмент теперь возвращает полный контент документа, чтобы модель могла его анализировать.
 */

/** HISTORY:
 * v1.2.0 (2025-06-06): Возвращаем полный контент документа в результате.
 * v1.1.0 (2025-06-06): Добавлена поддержка версионирования.
 * v1.0.0 (2025-06-06): Начальная версия.
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

      // Возвращаем ПОЛНЫЙ объект, чтобы модель могла его проанализировать.
      // Наш UI компонент отфильтрует то, что не нужно показывать.
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
