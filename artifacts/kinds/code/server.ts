/**
 * @file artifacts/code/server.ts
 * @description Серверный обработчик для артефактов типа "код".
 * @version 2.0.0
 * @date 2025-06-10
 * @updated Refactored to export a standalone `codeTool` object, removing the factory function.
 */

/** HISTORY:
 * v2.0.0 (2025-06-10): Refactored to export a standalone tool object.
 * v1.4.1 (2025-06-10): Ensured 'object' promise from streamObject is awaited before property access (TS2339).
 */

import { z } from 'zod'
import { streamObject } from 'ai'
import { myProvider } from '@/lib/ai/providers'
import { codePrompt, updateDocumentPrompt } from '@/lib/ai/prompts'
import type { ArtifactTool } from '@/artifacts/kinds/artifact-tools'

export const codeTool: ArtifactTool = {
  kind: 'code',
  create: async ({ prompt }) => {
    const { object } = await streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: codePrompt,
      prompt: prompt,
      schema: z.object({
        code: z.string(),
      }),
    })
    const resolvedObject = await object
    return resolvedObject.code
  },
  update: async ({ document, description }) => {
    const { object } = await streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(document.content, 'code'),
      prompt: description,
      schema: z.object({
        code: z.string(),
      }),
    })
    const resolvedObject = await object
    return resolvedObject.code
  },
}

// END OF: artifacts/code/server.ts
