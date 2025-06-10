/**
 * @file artifacts/tools/artifactCreate.ts
 * @description AI-инструмент для создания нового артефакта.
 * @version 2.1.0
 * @date 2025-06-10
 * @updated Исправлены ошибки типизации (TS2693, TS2322) путем использования `artifactKinds` и явного приведения типов.
 */

/** HISTORY:
 * v2.1.0 (2025-06-10): Исправлены ошибки типизации (TS2693, TS2322).
 * v2.0.0 (2025-06-10): Refactored to use ArtifactTool registry.
 * v1.1.0 (2025-06-10): Used AI_TOOL_NAMES constant for tool definition.
 * v1.0.0 (2025-06-09): Initial version.
 */

import { generateUUID } from '@/lib/utils'
import { tool } from 'ai'
import { z } from 'zod'
import type { Session } from 'next-auth'
import { artifactTools } from '@/artifacts/kinds/artifact-tools'
import { createLogger } from '@fab33/sys-logger'
import { AI_TOOL_NAMES } from '@/lib/ai/tools/constants'
import { saveArtifact } from '@/lib/db/queries'
import { type ArtifactKind, artifactKinds } from '@/components/artifact'
import { generateAndSaveSummary } from '@/lib/ai/summarizer'

const logger = createLogger('artifacts:tools:artifactCreate')

interface CreateArtifactProps {
  session: Session;
}

export const artifactCreate = ({ session }: CreateArtifactProps) =>
  tool({
    description:
      'Creates a new artifact (like text, code, image, or sheet) based on a title and a detailed prompt. Use this when the user explicitly asks to "create", "write", "generate", or "make" something new.',
    parameters: z.object({
      title: z.string().describe('A short, descriptive title for the new artifact.'),
      kind: z.enum(artifactKinds).describe('The type of artifact to create.'),
      prompt: z.string().describe('A detailed prompt or instruction for the AI model that will generate the content.'),
    }),
    execute: async ({ title, kind, prompt }) => {
      const artifactId = generateUUID()
      const childLogger = logger.child({ artifactId, kind, userId: session.user?.id })
      childLogger.trace({ title }, 'Entering artifactCreate tool')

      const handler = artifactTools.find((h) => h.kind === kind)

      if (!handler?.create) {
        const errorMsg = `Create operation for artifact of kind '${kind}' is not supported.`
        childLogger.error(errorMsg)
        return { error: errorMsg }
      }

      const content = await handler.create({ id: artifactId, title, prompt, session })

      await saveArtifact({
        id: artifactId,
        title,
        content,
        kind,
        userId: session.user!.id!,
        authorId: null, // Created by AI
      })

      childLogger.info({ kind, title }, 'Artifact created and saved successfully. Starting summary generation.')

      // We don't await this, it runs in the background
      generateAndSaveSummary(artifactId, content, kind as ArtifactKind)

      const result = {
        toolName: AI_TOOL_NAMES.ARTIFACT_CREATE,
        artifactId,
        artifactKind: kind,
        artifactTitle: title,
        description: `A new ${kind} artifact titled "${title}" was created.`,
        version: 1,
        totalVersions: 1,
        updatedAt: new Date().toISOString(),
        summary: null, // Summary will be generated in the background
      }

      childLogger.trace({ result }, 'Exiting artifactCreate tool')
      return result
    },
  })

// END OF: artifacts/tools/artifactCreate.ts
