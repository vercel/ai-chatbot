/**
 * @file artifacts/code/server.ts
 * @description Серверный обработчик для артефактов типа "код".
 * @version 1.4.0
 * @date 2025-06-09
 * @updated Исправлена ошибка отсутствия `await` при работе с `streamObject`.
 */

/** HISTORY:
 * v1.4.0 (2025-06-09): Добавлен `await` для `streamObject`.
 * v1.3.0 (2025-06-09): Обработчик теперь возвращает сгенерированный код, а не пишет в стрим.
 */

import { z } from 'zod'
import { streamObject } from 'ai'
import { myProvider } from '@/lib/ai/providers'
import { codePrompt, updateDocumentPrompt } from '@/lib/ai/prompts'
import { createDocumentHandler } from '@/lib/artifacts/factory'

export const codeDocumentHandler = createDocumentHandler<'code'>({
  kind: 'code',
  onCreateDocument: async ({ prompt }) => {
    const { object } = await streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: codePrompt,
      prompt: prompt,
      schema: z.object({
        code: z.string(),
      }),
    })
    return object.code
  },
  onUpdateDocument: async ({ document, description }) => {
    const { object } = await streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(document.content, 'code'),
      prompt: description,
      schema: z.object({
        code: z.string(),
      }),
    })
    return object.code
  },
})

// END OF: artifacts/code/server.ts
