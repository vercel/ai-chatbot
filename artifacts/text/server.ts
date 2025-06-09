/**
 * @file artifacts/text/server.ts
 * @description Серверный обработчик для текстовых артефактов.
 * @version 1.3.0
 * @date 2025-06-09
 * @updated Рефакторинг. Обработчик теперь возвращает сгенерированный текст, а не пишет в стрим.
 */

/** HISTORY:
 * v1.3.0 (2025-06-09): Обработчик теперь возвращает контент.
 * v1.2.0 (2025-06-09): Добавлена проверка на `dataStream`.
 * v1.1.0 (2025-06-09): Обновлен импорт `createDocumentHandler`.
 */

import { streamText } from 'ai'
import { myProvider } from '@/lib/ai/providers'
import { createDocumentHandler } from '@/lib/artifacts/factory'
import { updateDocumentPrompt } from '@/lib/ai/prompts'

export const textDocumentHandler = createDocumentHandler<'text'>({
  kind: 'text',
  onCreateDocument: async ({ title }) => {
    const { text } = await streamText({
      model: myProvider.languageModel('artifact-model'),
      system:
        'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
      prompt: title,
    })
    return text
  },
  onUpdateDocument: async ({ document, description }) => {
    const { text } = await streamText({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(document.content, 'text'),
      prompt: description,
      experimental_providerMetadata: {
        openai: {
          prediction: {
            type: 'content',
            content: document.content,
          },
        },
      },
    })
    return text
  },
})

// END OF: artifacts/text/server.ts
