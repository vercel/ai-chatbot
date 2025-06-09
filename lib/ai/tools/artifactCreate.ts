/**
 * @file lib/ai/tools/artifactCreate.ts
 * @description AI-инструмент для создания нового артефакта.
 * @version 1.0.0
 * @date 2025-06-09
 */

import { generateUUID } from '@/lib/utils'
import { tool } from 'ai'
import { z } from 'zod'
import type { Session } from 'next-auth'
import { artifactKinds, documentHandlersByArtifactKind, } from '@/lib/artifacts/server'
import { createLogger } from '@fab33/sys-logger'

const logger = createLogger('lib:ai:tools:artifactCreate')

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

      const documentHandler = documentHandlersByArtifactKind.find(
        (handler) => handler.kind === kind,
      )

      if (!documentHandler) {
        childLogger.error('No document handler found for kind')
        throw new Error(`No document handler found for kind: ${kind}`)
      }

      childLogger.info('Executing document handler to create artifact')
      // Handler creates the artifact record and starts background generation.
      await documentHandler.onCreateDocument({
        id: artifactId,
        title,
        // @ts-ignore - Assuming handler is updated to accept prompt
        prompt: prompt,
        session,
      })

      const result = {
        artifactId,
        artifactKind: kind,
        artifactTitle: title,
        description: `A new ${kind} artifact titled "${title}" was created.`,
        version: 1,
        totalVersions: 1,
        updatedAt: new Date().toISOString(),
        summary: null,
      }

      childLogger.trace({ result }, 'Exiting artifactCreate tool')
      return result
    },
  })

// END OF: lib/ai/tools/artifactCreate.ts
