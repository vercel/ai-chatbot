/**
 * @file lib/ai/tools/request-suggestions.ts
 * @description Инструмент для запроса предложений по улучшению документа.
 * @version 1.8.0
 * @date 2025-06-09
 * @updated Инструмент теперь не пишет в стрим, а просто сохраняет предложения в БД.
 */

/** HISTORY:
 * v1.8.0 (2025-06-09): Упрощение, удалена логика стриминга на клиент.
 * v1.7.0 (2025-06-09): Исправлена итерация по стриму и схема Zod.
 * v1.6.0 (2025-06-09): Исправлена итерация по стриму объектов.
 */
import { z } from 'zod'
import type { Session } from 'next-auth'
import { streamObject, tool } from 'ai'
import { getDocumentById, saveSuggestions } from '@/lib/db/queries'
import type { Suggestion } from '@/lib/db/schema'
import { generateUUID } from '@/lib/utils'
import { myProvider } from '../providers'
import { createLogger } from '@fab33/sys-logger'

const logger = createLogger('lib:ai:tools:request-suggestions')

interface RequestSuggestionsProps {
  session: Session;
}

export const requestSuggestions = ({
  session,
}: RequestSuggestionsProps) =>
  tool({
    description: 'Request suggestions for a document',
    parameters: z.object({
      documentId: z
        .string()
        .describe('The ID of the document to request edits'),
    }),
    execute: async ({ documentId }) => {
      const childLogger = logger.child({ documentId, userId: session.user?.id })
      childLogger.trace('Entering requestSuggestions tool')

      const documentResult = await getDocumentById({ id: documentId })

      if (!documentResult || !documentResult.doc.content) {
        childLogger.warn('Document not found or content is empty')
        return {
          error: 'Document not found or content is empty',
        }
      }

      const document = documentResult.doc

      const suggestions: Array<
        Omit<Suggestion, 'userId' | 'createdAt' | 'documentCreatedAt'>
      > = []

      childLogger.info('Streaming suggestions from AI model')
      const { object: suggestionObject } = await streamObject({
        model: myProvider.languageModel('artifact-model'),
        system:
          'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
        prompt: document.content ?? '',
        schema: z.object({
          suggestions: z.array(z.object({
            originalSentence: z.string().describe('The original sentence'),
            suggestedSentence: z.string().describe('The suggested sentence'),
            description: z.string().describe('The description of the suggestion'),
          }))
        }),
      })

      if (suggestionObject.suggestions) {
        for (const item of suggestionObject.suggestions) {
          if (item?.originalSentence && item?.suggestedSentence && item?.description) {
            suggestions.push({
              originalText: item.originalSentence,
              suggestedText: item.suggestedSentence,
              description: item.description,
              id: generateUUID(),
              documentId: documentId,
              isResolved: false,
            })
          }
        }
      }

      if (session.user?.id) {
        const userId = session.user.id
        childLogger.info(`Saving ${suggestions.length} suggestions to DB`)
        await saveSuggestions({
          suggestions: suggestions.map((suggestion) => ({
            ...suggestion,
            userId,
            createdAt: new Date(),
            documentCreatedAt: document.createdAt,
          })),
        })
      }

      const result = {
        id: documentId,
        title: document.title,
        kind: document.kind,
        message: 'Suggestions have been added to the document',
      }

      childLogger.trace({ result }, 'Exiting requestSuggestions tool')
      return result
    },
  })

// END OF: lib/ai/tools/request-suggestions.ts
