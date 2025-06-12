/**
 * @file artifacts/tools/artifactRestore.ts
 * @description AI-инструмент для восстановления "мягко" удаленного артефакта.
 * @version 2.0.1
 * @date 2025-06-11
 * @updated Added a guard clause to safely handle session.user.id.
 */

/** HISTORY:
 * v2.0.1 (2025-06-11): Replaced non-null assertion with a guard clause for session.user.id.
 * v2.0.0 (2025-06-10): Moved file to artifacts/tools directory.
 */

import { tool } from 'ai'
import type { Session } from 'next-auth'
import { z } from 'zod'
import { getArtifactById, restoreArtifactById } from '@/lib/db/queries'
import { createLogger } from '@fab33/fab-logger'
import { AI_TOOL_NAMES } from '@/lib/ai/tools/constants'

const logger = createLogger('artifacts:tools:artifactRestore')

export const artifactRestore = ({ session }: { session: Session }) =>
  tool({
    description: 'Restores a soft-deleted artifact from the trash.',
    parameters: z.object({
      id: z.string().describe('The UUID of the artifact to restore.'),
    }),
    execute: async ({ id }) => {
      if (!session?.user?.id) {
        logger.error('User session or user ID is missing. Cannot proceed with artifact restoration.')
        return { error: 'User is not authenticated. This action cannot be performed.' }
      }

      const childLogger = logger.child({ artifactId: id, userId: session.user.id })
      childLogger.trace('Entering artifactRestore tool')

      const restoredArtifact = await restoreArtifactById({ artifactId: id, userId: session.user.id })

      if (!restoredArtifact) {
        childLogger.warn('Artifact not found or permission denied for restore')
        return { error: `Artifact with ID '${id}' could not be restored.` }
      }

      const artifactResult = await getArtifactById({ id })

      const result = {
        toolName: AI_TOOL_NAMES.ARTIFACT_RESTORE,
        artifactId: id,
        artifactKind: artifactResult?.doc.kind,
        artifactTitle: artifactResult?.doc.title,
        description: `Artifact "${artifactResult?.doc.title}" has been restored.`,
        version: artifactResult?.totalVersions,
        totalVersions: artifactResult?.totalVersions,
        updatedAt: new Date().toISOString(),
        summary: artifactResult?.doc.summary,
      }

      childLogger.info('Artifact restored')
      return result
    },
  })

// END OF: artifacts/tools/artifactRestore.ts
