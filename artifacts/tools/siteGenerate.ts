/**
 * @file artifacts/tools/siteGenerate.ts
 * @description AI tool for generating a site artifact based on existing artifacts and block definitions.
 * @version 0.1.1
 * @date 2025-06-12
 * @updated Added result structure with tool name.
 */

/** HISTORY:
 * v0.1.1 (2025-06-12): Added result structure with tool name.
 * v0.1.0 (2025-06-12): Initial implementation of site generation tool.
 */

import { tool } from 'ai'
import { z } from 'zod'
import type { Session } from 'next-auth'
import { artifactCreate } from './artifactCreate'
import { blockDefinitions } from '@/site-blocks'
import { getPagedArtifactsByUserId } from '@/lib/db/queries'
import { createLogger } from '@fab33/fab-logger'
import { generateUUID } from '@/lib/utils'
import { AI_TOOL_NAMES } from '@/lib/ai/tools/constants'

const logger = createLogger('artifacts:tools:siteGenerate')

interface SiteGenerateProps {
  session: Session
}

interface SiteBlockDefinition {
  type: string
  slots: Record<string, { artifactId: string }>
}

interface SiteDefinition {
  theme: string
  blocks: Array<SiteBlockDefinition>
}

const SiteGenerateSchema = z.object({
  title: z.string().describe('Title for the generated site artifact.'),
  blocks: z.array(z.string()).describe('Ordered list of block types to include in the site.'),
})

export const siteGenerate = ({ session }: SiteGenerateProps) =>
  tool({
    description: 'Generates a site artifact by assembling blocks from existing artifacts found by tags.',
    parameters: SiteGenerateSchema,
    execute: async ({ title, blocks }) => {
      if (!session?.user?.id) {
        logger.error('User session or user ID is missing. Cannot generate site.')
        return { error: 'User is not authenticated. This action cannot be performed.' }
      }

      const childLogger = logger.child({ userId: session.user.id, title })
      childLogger.trace({ blocks }, 'Entering siteGenerate tool')

      const siteDefinition: SiteDefinition = { theme: 'default', blocks: [] }

      for (const blockType of blocks) {
        const definition = blockDefinitions[blockType]
        if (!definition) continue

        const block: SiteBlockDefinition = { type: blockType, slots: {} }

        for (const [slotName, slotDef] of Object.entries(definition.slots)) {
          let artifactId = ''
          const firstTag = slotDef.tags?.[0]
          if (firstTag) {
            const { data } = await getPagedArtifactsByUserId({
              userId: session.user.id,
              searchQuery: firstTag,
              page: 1,
              pageSize: 1,
              kind: slotDef.kind,
            })
            artifactId = data[0]?.id ?? ''
          }
          block.slots[slotName] = { artifactId }
        }

        siteDefinition.blocks.push(block)
      }

      const createTool = artifactCreate({ session })
      const result = await createTool.execute(
        {
          title,
          kind: 'site',
          prompt: JSON.stringify(siteDefinition),
        },
        { toolCallId: generateUUID(), messages: [] }
      )
      if ('artifactId' in result) {
        childLogger.info({ siteId: result.artifactId }, 'Site artifact created')
        return { ...result, toolName: AI_TOOL_NAMES.SITE_GENERATE, siteDefinition }
      }

      return result
    },
  })

// END OF: artifacts/tools/siteGenerate.ts
