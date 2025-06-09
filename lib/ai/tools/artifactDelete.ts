/**
 * @file lib/ai/tools/artifactDelete.ts
 * @description AI-инструмент для "мягкого" удаления артефакта.
 * @version 1.0.0
 * @date 2025-06-09
 */

import { tool } from 'ai'
import type { Session } from 'next-auth'
import { z } from 'zod'
import { deleteArtifactSoftById, getArtifactById } from '@/lib/db/queries'
import { createLogger } from '@fab33/sys-logger'

const logger = createLogger('lib:ai:tools:artifactDelete')

export const artifactDelete = ({ session }: { session: Session }) =>
  tool({
    description: 'Soft-deletes an artifact, moving it to the trash. The artifact can be restored later.',
    parameters: z.object({
      id: z.string().uuid().describe('The UUID of the artifact to delete.'),
    }),
    execute: async ({ id }) => {
      const childLogger = logger.child({ artifactId: id, userId: session.user?.id })
      childLogger.trace('Entering artifactDelete tool')

      const artifactResult = await getArtifactById({ id })
      if (!artifactResult || artifactResult.doc.userId !== session.user?.id) {
        childLogger.warn('Artifact not found or permission denied')
        return { error: `Artifact with ID '${id}' not found or you do not have permission to delete it.` }
      }

      await deleteArtifactSoftById({ artifactId: id, userId: session.user!.id! })

      const result = {
        artifactId: id,
        artifactKind: artifactResult.doc.kind,
        artifactTitle: artifactResult.doc.title,
        description: `Artifact "${artifactResult.doc.title}" was moved to the trash.`,
        version: artifactResult.totalVersions,
        totalVersions: artifactResult.totalVersions,
        updatedAt: new Date().toISOString(),
        summary: artifactResult.doc.summary,
      }

      childLogger.info('Artifact soft-deleted')
      return result
    },
  })

// END OF: lib/ai/tools/artifactDelete.ts
