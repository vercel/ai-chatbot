/**
 * @file lib/artifacts/factory.ts
 * @description Фабричная функция для создания обработчиков документов (артефактов).
 * @version 1.4.0
 * @date 2025-06-09
 * @updated Сигнатуры обработчиков изменены. Теперь они возвращают Promise<string> и не принимают dataStream, следуя паттерну "черного ящика".
 */

/** HISTORY:
 * v1.4.0 (2025-06-09): Обработчики теперь возвращают Promise<string> и не принимают dataStream.
 * v1.3.0 (2025-06-09): Фабрика `createDocumentHandler` вынесена для устранения циклической зависимости.
 */

import type { Session } from 'next-auth'
import { createLogger } from '@fab33/sys-logger'

import type { ArtifactKind } from '@/components/artifact'
import { saveDocument } from '../db/queries'
import type { Document } from '../db/schema'

/**
 * @description Определяет параметры для колбека создания документа.
 * В рамках архитектуры "черного ящика", этот колбек не имеет прямого доступа к стриму.
 * Его задача - сгенерировать контент и вернуть его.
 * @see https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
 */
export interface CreateDocumentCallbackProps {
  id: string;
  title: string;
  session: Session;
}

/**
 * @description Определяет параметры для колбека обновления документа.
 */
export interface UpdateDocumentCallbackProps {
  document: Document;
  description: string;
  session: Session;
}

/**
 * @description Обработчик документа. Отвечает за логику создания и обновления контента для конкретного типа артефакта.
 * @method onCreateDocument - Асинхронно генерирует и возвращает контент нового документа.
 * @method onUpdateDocument - Асинхронно генерирует и возвращает обновленный контент существующего документа.
 */
export interface DocumentHandler<T = ArtifactKind> {
  kind: T;
  onCreateDocument: (args: CreateDocumentCallbackProps) => Promise<string>;
  onUpdateDocument: (args: UpdateDocumentCallbackProps) => Promise<string>;
}

export function createDocumentHandler<T extends ArtifactKind> (config: {
  kind: T;
  onCreateDocument: (params: CreateDocumentCallbackProps) => Promise<string>;
  onUpdateDocument: (params: UpdateDocumentCallbackProps) => Promise<string>;
}): DocumentHandler<T> {
  const logger = createLogger('lib:artifacts:factory')
  const handlerLogger = logger.child({ handlerKind: config.kind })

  return {
    kind: config.kind,
    onCreateDocument: async (args: CreateDocumentCallbackProps) => {
      const childLogger = handlerLogger.child({ documentId: args.id, function: 'onCreateDocument' })
      childLogger.trace({ title: args.title }, 'Entering handler')

      const draftContent = await config.onCreateDocument(args);

      if (args.session?.user?.id) {
        childLogger.info('Saving newly created document')
        await saveDocument({
          id: args.id,
          title: args.title,
          content: draftContent,
          kind: config.kind,
          userId: args.session.user.id,
          authorId: null, // Created by AI
        })
      }
      childLogger.trace('Exiting handler')
      return draftContent;
    },
    onUpdateDocument: async (args: UpdateDocumentCallbackProps) => {
      const childLogger = handlerLogger.child({ documentId: args.document.id, function: 'onUpdateDocument' })
      childLogger.trace({ description: args.description }, 'Entering handler')

      const draftContent = await config.onUpdateDocument(args);

      if (args.session?.user?.id) {
        childLogger.info('Saving updated document')
        await saveDocument({
          id: args.document.id,
          title: args.document.title,
          content: draftContent,
          kind: config.kind,
          userId: args.session.user.id,
          authorId: null, // Updated by AI
        })
      }
      childLogger.trace('Exiting handler')
      return draftContent;
    },
  }
}

// END OF: lib/artifacts/factory.ts
