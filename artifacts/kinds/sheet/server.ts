/**
 * @file artifacts/sheet/server.ts
 * @description Серверный обработчик для артефактов типа "таблица".
 * @version 2.0.0
 * @date 2025-06-10
 * @updated Refactored to export a standalone `sheetTool` object, removing the factory function.
 */

/** HISTORY:
 * v2.0.0 (2025-06-10): Refactored to export a standalone tool object.
 * v1.4.1 (2025-06-10): Ensured 'object' promise from streamObject is awaited before property access (TS2339).
 */

import { myProvider } from '@/lib/ai/providers'
import { sheetPrompt, updateDocumentPrompt } from '@/lib/ai/prompts'
import { streamObject } from 'ai'
import { z } from 'zod'
import type { ArtifactTool } from '@/artifacts/kinds/artifact-tools'

export const sheetTool: ArtifactTool = {
  kind: 'sheet',
  create: async ({ prompt }) => {
    const { object } = await streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: sheetPrompt,
      prompt: prompt,
      schema: z.object({
        csv: z.string().describe('CSV data'),
      }),
    })
    const resolvedObject = await object
    return resolvedObject.csv
  },
  update: async ({ document, description }) => {
    const { object } = await streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(document.content, 'sheet'),
      prompt: description,
      schema: z.object({
        csv: z.string(),
      }),
    })
    const resolvedObject = await object
    return resolvedObject.csv
  },
}

// END OF: artifacts/sheet/server.ts
