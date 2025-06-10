/**
 * @file artifacts/tools/artifactCreate.ts
 * @description AI-инструмент для создания нового артефакта.
 * @version 2.2.0
 * @date 2025-06-10
 * @updated Исправлены все ошибки типизации (TS2305, TS2322, TS2724) путем обновления импортов и явной типизации.
 */

/** HISTORY:
 * v2.2.0 (2025-06-10): Исправлены ошибки типизации.
 * v2.1.0 (2025-06-10): Исправлены ошибки типизации (TS2693, TS2322) путем использования `artifactKinds` и явного приведения типов.
 * v2.0.0 (2025-06-10): Refactored to use ArtifactTool registry.
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
      const { title, kind, prompt } = args // Явная деструктуризация
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
        title, // Теперь здесь string
        content,
        kind, // Теперь здесь ArtifactKind
        userId: session.user!.id!,
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
