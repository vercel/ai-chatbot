/**
 * @file lib/ai/tools/create-document.ts
 * @description Инструмент для создания нового документа (артефакта).
 * @version 1.6.0
 * @date 2025-06-09
 * @updated Инструмент теперь вызывает обработчик, который возвращает контент, и затем возвращает результат.
 */

/** HISTORY:
 * v1.6.0 (2025-06-09): Переход на архитектуру "черного ящика".
 * v1.5.0 (2025-06-09): Очистка кода от `dataStream`.
 * v1.4.0 (2025-06-09): Очистка кода от @ts-ignore.
 */

import { generateUUID } from '@/lib/utils'
import { tool } from 'ai'
import { z } from 'zod'
import type { Session } from 'next-auth'
import { artifactKinds, documentHandlersByArtifactKind, } from '@/lib/artifacts/server'
import { createLogger } from '@fab33/sys-logger'

const logger = createLogger('lib:ai:tools:create-document')

interface CreateDocumentProps {
  session: Session;
}

export const createDocument = ({ session }: CreateDocumentProps) =>
  tool({
    description:
      'Create a document for a writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind.',
    parameters: z.object({
      title: z.string(),
      kind: z.enum(artifactKinds),
    }),
    execute: async ({ title, kind }) => {
      const documentId = generateUUID()
      const childLogger = logger.child({ documentId, kind, userId: session.user?.id })
      childLogger.trace({ title }, 'Entering createDocument tool')

      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === kind,
      )

      if (!documentHandler) {
        childLogger.error('No document handler found for kind')
        throw new Error(`No document handler found for kind: ${kind}`)
      }

      childLogger.info('Executing document handler')
      // Обработчик теперь сам отвечает за генерацию контента и сохранение в БД.
      await documentHandler.onCreateDocument({
        id: documentId,
        title,
        session,
      })

      const result = {
        id: documentId,
        title,
        kind,
        content: `A new document "${title}" was created. You can now view and edit it.`,
      }
      childLogger.trace({ result }, 'Exiting createDocument tool')
      return result
    },
  })

// END OF: lib/ai/tools/create-document.ts
