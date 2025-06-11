/**
 * @file artifacts/tools/artifactCreate.ts
 * @description AI-инструмент для создания нового артефакта.
 * @version 2.2.1
 * @date 2025-06-11
 * @updated Added a guard clause to safely handle session.user.id.
 */

/** HISTORY:
 * v2.2.1 (2025-06-11): Replaced non-null assertion with a guard clause for session.user.id.
 * v2.2.0 (2025-06-10): Исправлены все ошибки типизации (TS2305, TS2322, TS2724) путем обновления импортов и явной типизации.
 */

import { generateUUID } from '@/lib/utils'
import { tool } from 'ai'
import { z } from 'zod'
import type { Session } from 'next-auth'
import { artifactTools } from '@/artifacts/kinds/artifact-tools'
import { createLogger } from '@fab33/sys-logger'
import { AI_TOOL_NAMES } from '@/lib/ai/tools/constants'
import { saveArtifact } from '@/lib/db/queries'
import { artifactKinds } from '@/lib/types'
import { generateAndSaveSummary } from '@/lib/ai/summarizer'

const logger = createLogger('artifacts:tools:artifactCreate')

const CreateArtifactSchema = z.object({
  title: z.string().describe('A short, descriptive title for the new artifact.'),
  kind: z.enum(artifactKinds).describe('The type of artifact to create.'),
  prompt: z.string().describe('A detailed prompt or instruction for the AI model that will generate the content.'),
})

type CreateArtifactParams = z.infer<typeof CreateArtifactSchema>;

interface CreateArtifactProps {
  session: Session;
}

export const artifactCreate = ({ session }: CreateArtifactProps) =>
  tool({
    description:
      'Creates a new artifact (like text, code, image, or sheet) based on a title and a detailed prompt. Use this when the user explicitly asks to "create", "write", "generate", or "make" something new.',
    parameters: CreateArtifactSchema,
    execute: async (args: CreateArtifactParams) => {
      if (!session?.user?.id) {
        logger.error('User session or user ID is missing. Cannot proceed with artifact creation.')
        return { error: 'User is not authenticated. This action cannot be performed.' }
      }

      const { title, kind, prompt } = args
      const artifactId = generateUUID()
      const childLogger = logger.child({ artifactId, kind, userId: session.user.id })
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
        userId: session.user.id,
        authorId: null, // Created by AI
      })

      childLogger.info({ kind, title }, 'Artifact created and saved successfully. Starting summary generation.')

      // We don't await this, it runs in the background
      generateAndSaveSummary(artifactId, content, kind)

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
