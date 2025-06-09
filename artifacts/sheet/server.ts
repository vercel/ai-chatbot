/**
 * @file artifacts/sheet/server.ts
 * @description Серверный обработчик для артефактов типа "таблица".
 * @version 1.3.0
 * @date 2025-06-09
 * @updated Рефакторинг. Обработчик теперь возвращает сгенерированный CSV, а не пишет в стрим.
 */

/** HISTORY:
 * v1.3.0 (2025-06-09): Обработчик теперь возвращает контент.
 * v1.2.0 (2025-06-09): Добавлена проверка на `dataStream`.
 * v1.1.0 (2025-06-09): Обновлен импорт `createDocumentHandler`.
 */

import { myProvider } from '@/lib/ai/providers'
import { sheetPrompt, updateDocumentPrompt } from '@/lib/ai/prompts'
import { createDocumentHandler } from '@/lib/artifacts/factory'
import { streamObject } from 'ai'
import { z } from 'zod'

export const sheetDocumentHandler = createDocumentHandler<'sheet'>({
  kind: 'sheet',
  onCreateDocument: async ({ title }) => {
    const { object } = await streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: sheetPrompt,
      prompt: title,
      schema: z.object({
        csv: z.string().describe('CSV data'),
      }),
    })
    return object.csv
  },
  onUpdateDocument: async ({ document, description }) => {
    const { object } = await streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(document.content, 'sheet'),
      prompt: description,
      schema: z.object({
        csv: z.string(),
      }),
    })
    return object.csv
  },
})

// END OF: artifacts/sheet/server.ts
