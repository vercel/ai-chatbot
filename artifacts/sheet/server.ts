/**
 * @file artifacts/sheet/server.ts
 * @description Серверный обработчик для артефактов типа "таблица".
 * @version 1.4.0
 * @date 2025-06-09
 * @updated Исправлена ошибка отсутствия `await` при работе с `streamObject`.
 */

/** HISTORY:
 * v1.4.0 (2025-06-09): Добавлен `await` для `streamObject`.
 * v1.3.0 (2025-06-09): Рефакторинг. Обработчик теперь возвращает сгенерированный CSV.
 */

import { myProvider } from '@/lib/ai/providers'
import { sheetPrompt, updateDocumentPrompt } from '@/lib/ai/prompts'
import { createDocumentHandler } from '@/lib/artifacts/factory'
import { streamObject } from 'ai'
import { z } from 'zod'

export const sheetDocumentHandler = createDocumentHandler<'sheet'>({
  kind: 'sheet',
  onCreateDocument: async ({ prompt }) => {
    const { object } = await streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: sheetPrompt,
      prompt: prompt,
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
