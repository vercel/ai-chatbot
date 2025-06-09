/**
 * @file lib/artifacts/server.ts
 * @description Центральный экспорт обработчиков артефактов.
 * @version 1.3.0
 * @date 2025-06-09
 * @updated Рефакторинг для разрыва циклической зависимости. Фабричная функция вынесена в factory.ts.
 */

/** HISTORY:
 * v1.3.0 (2025-06-09): Фабрика `createDocumentHandler` вынесена для устранения циклической зависимости.
 * v1.2.1 (2025-06-09): Исправлена ошибка инициализации логгера путем переноса его создания внутрь `createDocumentHandler`.
 * v1.2.0 (2025-06-09): Внедрена система структурированного логирования.
 * v1.1.0 (2025-06-07): Удален неиспользуемый и несуществующий импорт.
 */
import { codeDocumentHandler } from '@/artifacts/code/server'
import { imageDocumentHandler } from '@/artifacts/image/server'
import { sheetDocumentHandler } from '@/artifacts/sheet/server'
import { textDocumentHandler } from '@/artifacts/text/server'
import type { CreateDocumentCallbackProps, UpdateDocumentCallbackProps, DocumentHandler } from './factory';


export type { CreateDocumentCallbackProps, UpdateDocumentCallbackProps, DocumentHandler };


/*
 * Use this array to define the document handlers for each artifact kind.
 */
export const documentHandlersByArtifactKind: Array<DocumentHandler<any>> = [
  textDocumentHandler,
  codeDocumentHandler,
  imageDocumentHandler,
  sheetDocumentHandler,
]

export const artifactKinds = ['text', 'code', 'image', 'sheet'] as const

// END OF: lib/artifacts/server.ts
