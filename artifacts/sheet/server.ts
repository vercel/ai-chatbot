/**
 * @file artifacts/sheet/server.ts
 * @description Серверный обработчик для артефактов типа "таблица".
 * @version 1.4.1
 * @date 2025-06-10
 * @updated Ensured 'object' promise from streamObject is awaited before property access (TS2339).
 */

/** HISTORY:
 * v1.4.1 (2025-06-10): Fixed TS2339 by awaiting the 'object' promise from streamObject result before accessing its 'csv' property.
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
    const resolvedObject = await object;
    return resolvedObject.csv;
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
    const resolvedObject = await object;
    return resolvedObject.csv;
  },
})

// END OF: artifacts/sheet/server.ts
