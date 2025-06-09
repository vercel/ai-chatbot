/**
 * @file lib/ai/tools/artifactContent.ts
 * @description AI-инструмент для получения полного содержимого артефакта.
 * @version 1.0.0
 * @date 2025-06-09
 */

import { tool } from 'ai'
import { z } from 'zod'
import { getArtifactById } from '@/lib/db/queries'
import { ChatSDKError } from '@/lib/errors'
import { createLogger } from '@fab33/sys-logger'

const logger = createLogger('lib:ai:tools:artifactContent')

export const artifactContent = tool({
  description: 'Gets the full content of an artifact by its ID and optional version. Use this to read a document to answer a question or perform a task.',
  parameters: z.object({
    artifactId: z.string().uuid({ message: 'Invalid artifact ID. Please provide a valid UUID.' }).describe('The UUID of the artifact to retrieve.'),
    version: z.number().optional().describe('The specific version number (1-indexed). If omitted, the latest version is returned.'),
  }),
  execute: async (args) => {
    const childLogger = logger.child({ artifactId: args.artifactId, version: args.version })
    childLogger.trace('Entering artifactContent tool')

    try {
      const { artifactId, version } = args
      const result = await getArtifactById({ id: artifactId, version })

      if (!result) {
        childLogger.warn('Artifact not found in DB')
        throw new ChatSDKError('not_found:database', 'Artifact not found.')
      }

      const { doc, totalVersions } = result
      const returnedVersionNumber = version ?? totalVersions

      const finalResult = {
        artifactId: doc.id,
        artifactTitle: doc.title,
        artifactKind: doc.kind,
        content: doc.content,
        version: returnedVersionNumber,
        totalVersions: totalVersions,
        authorId: doc.authorId,
        createdAt: doc.createdAt.toISOString(),
      }

      childLogger.info('Artifact content retrieved successfully')
      return finalResult

    } catch (error) {
      childLogger.error({ err: error as Error }, 'Failed to get artifact content')
      if (error instanceof z.ZodError) {
        return { error: error.issues[0].message }
      }
      return { error: `Failed to retrieve artifact with ID ${args.artifactId}.` }
    }
  },
})

// END OF: lib/ai/tools/artifactContent.ts
