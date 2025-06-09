/**
 * @file lib/artifacts/factory.ts
 * @description Фабричная функция для создания обработчиков артефактов.
 * @version 1.5.0
 * @date 2025-06-09
 * @updated Переход на `saveArtifact` и тип `Artifact`.
 */

/** HISTORY:
 * v1.5.0 (2025-06-09): Переход на `saveArtifact` и тип `Artifact`.
 * v1.4.0 (2025-06-09): Обработчики теперь возвращают Promise<string> и не принимают dataStream.
 */

import type { Session } from 'next-auth'
import { createLogger } from '@fab33/sys-logger'

import type { ArtifactKind } from '@/components/artifact'
import { saveArtifact } from '../db/queries'
import type { Artifact } from '../db/schema'

export interface CreateDocumentCallbackProps {
  id: string;
  title: string;
  session: Session;
  prompt: string;
}

export interface UpdateDocumentCallbackProps {
  document: Artifact; // Используем новый тип
  description: string;
  session: Session;
}

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

      const draftContent = await config.onCreateDocument(args)

      if (args.session?.user?.id) {
        childLogger.info('Saving newly created artifact')
        await saveArtifact({ // Используем новую функцию
          id: args.id,
          title: args.title,
          content: draftContent,
          kind: config.kind,
          userId: args.session.user.id,
          authorId: null, // Created by AI
        })
      }
      childLogger.trace('Exiting handler')
      return draftContent
    },
    onUpdateDocument: async (args: UpdateDocumentCallbackProps) => {
      const childLogger = handlerLogger.child({ documentId: args.document.id, function: 'onUpdateDocument' })
      childLogger.trace({ description: args.description }, 'Entering handler')

      const draftContent = await config.onUpdateDocument(args)

      if (args.session?.user?.id) {
        childLogger.info('Saving updated artifact')
        await saveArtifact({ // Используем новую функцию для создания новой версии
          id: args.document.id,
          title: args.document.title,
          content: draftContent,
          kind: config.kind,
          userId: args.session.user.id,
          authorId: null, // Updated by AI
        })
      }
      childLogger.trace('Exiting handler')
      return draftContent
    },
  }
}

// END OF: lib/artifacts/factory.ts
