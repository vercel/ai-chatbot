/**
 * @file artifacts/text/server.ts
 * @description Серверный обработчик для текстовых артефактов.
 * @version 2.0.0
 * @date 2025-06-10
 * @updated Refactored to export a standalone `textTool` object, removing the factory function.
 */

/** HISTORY:
 * v2.0.0 (2025-06-10): Refactored to export a standalone tool object.
 * v1.3.0 (2025-06-09): Рефакторинг. Обработчик теперь возвращает сгенерированный текст.
 */

import { streamText } from 'ai'
import { myProvider } from '@/lib/ai/providers'
import { updateDocumentPrompt } from '@/lib/ai/prompts'
import type { ArtifactTool } from '@/artifacts/kinds/artifact-tools'

export const textTool: ArtifactTool = {
  kind: 'text',
  create: async ({ title }) => {
    const { text } = await streamText({
      model: myProvider.languageModel('artifact-model'),
      system:
        'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
      prompt: title,
    })
    return text
  },
  update: async ({ document, description }) => {
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
}

// END OF: artifacts/text/server.ts
