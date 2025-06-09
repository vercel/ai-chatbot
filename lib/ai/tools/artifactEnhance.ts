/**
 * @file lib/ai/tools/artifactEnhance.ts
 * @description Инструмент для "улучшения" артефакта по предопределенному рецепту.
 * @version 1.1.0
 * @date 2025-06-09
 * @updated Исправлена логика работы с `streamObject` и сохранения новой версии артефакта.
 */

/** HISTORY:
 * v1.1.0 (2025-06-09): Исправлена работа с `await`, добавлено создание новой версии артефакта.
 * v1.0.0 (2025-06-09): Начальная версия.
 */

import { streamObject, tool } from 'ai'
import type { Session } from 'next-auth'
import { z } from 'zod'
import { getArtifactById, saveArtifact, saveSuggestions } from '@/lib/db/queries'
import { createLogger } from '@fab33/sys-logger'
import { myProvider } from '../providers'
import { generateUUID } from '@/lib/utils'
import type { Suggestion } from '@/lib/db/schema'

const logger = createLogger('lib:ai:tools:artifactEnhance')

interface EnhanceArtifactProps {
  session: Session;
}

const recipes = {
  polish: 'Please add final polish and check for grammar, add section titles for better structure, and ensure everything reads smoothly.',
  suggest: 'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
} as const

export const artifactEnhance = ({ session }: EnhanceArtifactProps) =>
  tool({
    description: 'Enhances a document by applying a specific recipe, like "polish" or "suggest". This creates a new version of the artifact with suggestions.',
    parameters: z.object({
      id: z.string().uuid().describe('The UUID of the artifact to enhance.'),
      recipe: z.enum(['polish', 'suggest']).describe('The enhancement recipe to apply.'),
    }),
    execute: async ({ id, recipe }) => {
      const childLogger = logger.child({ artifactId: id, userId: session.user?.id, recipe })
      childLogger.trace('Entering artifactEnhance tool')

      const artifactResult = await getArtifactById({ id })
      if (!artifactResult || !artifactResult.doc.content) {
        childLogger.warn('Artifact not found or content is empty')
        return { error: 'Artifact not found or has no content to enhance.' }
      }

      const { doc: artifact, totalVersions } = artifactResult

      const newVersionDate = new Date()
      // 1. Create a new artifact version row
      await saveArtifact({
        ...artifact,
        createdAt: newVersionDate,
        content: artifact.content ?? ''
      })

      // 2. Generate suggestions
      const prompt = recipes[recipe]
      const suggestions: Array<Omit<Suggestion, 'userId' | 'createdAt' | 'documentCreatedAt'>> = []

      const { object } = await streamObject({
        model: myProvider.languageModel('artifact-model'),
        system: prompt,
        prompt: artifact.content ?? '',
        schema: z.object({
          suggestions: z.array(z.object({
            originalSentence: z.string(),
            suggestedSentence: z.string(),
            description: z.string(),
          }))
        }),
      })

      if (object.suggestions) {
        for (const item of object.suggestions) {
          if (item?.originalSentence && item?.suggestedSentence && item?.description) {
            suggestions.push({
              originalText: item.originalSentence,
              suggestedText: item.suggestedSentence,
              description: item.description,
              id: generateUUID(),
              documentId: id,
              isResolved: false,
              isDismissed: false,
            })
          }
        }
      }

      // 3. Save suggestions pointing to the new version
      if (session.user?.id && suggestions.length > 0) {
        childLogger.info(`Saving ${suggestions.length} suggestions to DB for new version`)
        await saveSuggestions({
          suggestions: suggestions.map((s) => ({
            ...s,
            userId: session.user!.id,
            createdAt: new Date(),
            documentCreatedAt: newVersionDate,
          })),
        })
      }

      const newVersionNumber = totalVersions + 1
      const result = {
        artifactId: id,
        artifactKind: artifact.kind,
        artifactTitle: artifact.title,
        description: `Applied recipe "${recipe}" and created suggestions.`,
        version: newVersionNumber,
        totalVersions: newVersionNumber,
        updatedAt: newVersionDate.toISOString(),
        summary: artifact.summary,
      }

      childLogger.trace({ result }, 'Exiting artifactEnhance tool')
      return result
    },
  })

// END OF: lib/ai/tools/artifactEnhance.ts
