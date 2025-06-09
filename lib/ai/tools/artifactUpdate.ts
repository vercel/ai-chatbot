/**
 * @file lib/ai/tools/artifactUpdate.ts
 * @description AI-инструмент для обновления существующего артефакта.
 * @version 1.0.0
 * @date 2025-06-09
 */

import { tool } from 'ai'
import type { Session } from 'next-auth'
import { z } from 'zod'
import { getArtifactById } from '@/lib/db/queries'
import { documentHandlersByArtifactKind } from '@/lib/artifacts/server'
import { createLogger } from '@fab33/sys-logger'

const logger = createLogger('lib:ai:tools:artifactUpdate')

interface UpdateArtifactProps {
  session: Session;
}

export const artifactUpdate = ({ session }: UpdateArtifactProps) =>
  tool({
    description: 'Updates an existing artifact (text, code, image, etc.) based on a detailed prompt describing the changes. Requires the artifact\'s unique ID.',
    parameters: z.object({
      id: z.string().uuid().describe('The UUID of the artifact to update. This ID must be from the current context.'),
      prompt: z.string().describe('A detailed text description of the changes to be made.'),
    }),
    execute: async ({ id, prompt }) => {
      const childLogger = logger.child({ artifactId: id, userId: session.user?.id })
      childLogger.trace({ prompt }, 'Entering artifactUpdate tool')

      const artifactResult = await getArtifactById({ id })

      if (!artifactResult) {
        childLogger.warn('Artifact not found')
        return { error: `Artifact with ID '${id}' not found.` }
      }

      const { doc: artifact, totalVersions } = artifactResult

      const documentHandler = documentHandlersByArtifactKind.find(
        (handler) => handler.kind === artifact.kind,
      )

      if (!documentHandler) {
        childLogger.error({ kind: artifact.kind }, 'No document handler found for kind')
        throw new Error(`No document handler found for kind: ${artifact.kind}`)
      }

      childLogger.info('Executing document handler for update')
      await documentHandler.onUpdateDocument({
        document: artifact,
        // @ts-ignore - Assuming handler is updated to accept prompt
        description: prompt,
        session,
      })

      const newVersion = totalVersions + 1

      const result = {
        artifactId: id,
        artifactKind: artifact.kind,
        artifactTitle: artifact.title,
        description: `Artifact "${artifact.title}" has been updated.`,
        version: newVersion,
        totalVersions: newVersion,
        updatedAt: new Date().toISOString(),
        summary: null, // Summary will be regenerated for the new version.
      }

      childLogger.trace({ result }, 'Exiting artifactUpdate tool')
      return result
    },
  })

// END OF: lib/ai/tools/artifactUpdate.ts
