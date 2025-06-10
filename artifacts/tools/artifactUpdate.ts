/**
 * @file artifacts/tools/artifactUpdate.ts
 * @description AI-инструмент для обновления существующего артефакта.
 * @version 2.0.0
 * @date 2025-06-10
 * @updated Refactored to use the ArtifactTool registry for dispatching update logic.
 */

/** HISTORY:
 * v2.0.0 (2025-06-10): Refactored to use ArtifactTool registry.
 * v1.1.0 (2025-06-10): Used AI_TOOL_NAMES constant for tool definition.
 * v1.0.0 (2025-06-09): Initial version.
 */

import { tool } from 'ai'
import type { Session } from 'next-auth'
import { z } from 'zod'
import { getArtifactById, saveArtifact } from '@/lib/db/queries'
import { artifactTools } from '@/artifacts/kinds/artifact-tools'
import { createLogger } from '@fab33/sys-logger'
import { AI_TOOL_NAMES } from '@/lib/ai/tools/constants'
import { generateAndSaveSummary } from '@/lib/ai/summarizer'

const logger = createLogger('artifacts:tools:artifactUpdate')

interface UpdateArtifactProps {
  session: Session;
}

export const artifactUpdate = ({ session }: UpdateArtifactProps) =>
  tool({
    description: 'Updates an existing artifact (text, code, image, etc.) based on a detailed prompt describing the changes. Requires the artifact\'s unique ID.',
    parameters: z.object({
      id: z.string().describe('The UUID of the artifact to update. This ID must be from the current context.'),
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

      const handler = artifactTools.find((h) => h.kind === artifact.kind)

      if (!handler?.update) {
        const errorMsg = `Update operation for artifact of kind '${artifact.kind}' is not supported.`
        childLogger.error(errorMsg)
        return { error: errorMsg }
      }

      const newContent = await handler.update({
        document: artifact,
        description: prompt,
        session,
      })

      await saveArtifact({
        id: artifact.id,
        title: artifact.title,
        content: newContent,
        kind: artifact.kind,
        userId: session.user!.id!,
        authorId: null, // Updated by AI
      })

      childLogger.info({ kind: artifact.kind, title: artifact.title }, 'Artifact updated. Starting summary generation.')

      // We don't await this, it runs in the background
      generateAndSaveSummary(id, newContent, artifact.kind);

      const newVersion = totalVersions + 1

      const result = {
        toolName: AI_TOOL_NAMES.ARTIFACT_UPDATE,
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

// END OF: artifacts/tools/artifactUpdate.ts
