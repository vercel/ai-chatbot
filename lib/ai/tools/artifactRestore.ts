/**
 * @file lib/ai/tools/artifactRestore.ts
 * @description AI-инструмент для восстановления "мягко" удаленного артефакта.
 * @version 1.0.0
 * @date 2025-06-09
 */

import { tool } from 'ai'
import type { Session } from 'next-auth'
import { z } from 'zod'
import { getArtifactById, restoreArtifactById } from '@/lib/db/queries'
import { createLogger } from '@fab33/sys-logger'

const logger = createLogger('lib:ai:tools:artifactRestore')

export const artifactRestore = ({ session }: { session: Session }) =>
  tool({
    description: 'Restores a soft-deleted artifact from the trash.',
    parameters: z.object({
      id: z.string().uuid().describe('The UUID of the artifact to restore.'),
    }),
    execute: async ({ id }) => {
      const childLogger = logger.child({ artifactId: id, userId: session.user?.id })
      childLogger.trace('Entering artifactRestore tool')

      const restoredArtifact = await restoreArtifactById({ artifactId: id, userId: session.user!.id! })

      if (!restoredArtifact) {
        childLogger.warn('Artifact not found or permission denied for restore')
        return { error: `Artifact with ID '${id}' could not be restored.` }
      }

      const artifactResult = await getArtifactById({ id })

      const result = {
        artifactId: id,
        artifactKind: artifactResult!.doc.kind,
        artifactTitle: artifactResult!.doc.title,
        description: `Artifact "${artifactResult!.doc.title}" has been restored.`,
        version: artifactResult!.totalVersions,
        totalVersions: artifactResult!.totalVersions,
        updatedAt: new Date().toISOString(),
        summary: artifactResult!.doc.summary,
      }

      childLogger.info('Artifact restored')
      return result
    },
  })

// END OF: lib/ai/tools/artifactRestore.ts
