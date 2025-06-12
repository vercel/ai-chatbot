/**
 * @file site-blocks/types.ts
 * @description Типы для системы блоков сайта.
 * @version 0.1.0
 * @date 2025-06-12
 * @updated Initial version.
 */

/** HISTORY:
 * v0.1.0 (2025-06-12): Initial version.
 */

import type { ArtifactKind } from '@/lib/types'

export interface BlockSlotDefinition {
  kind: ArtifactKind
  tags?: Array<string>
}

export interface BlockDefinition {
  type: string
  title: string
  slots: Record<string, BlockSlotDefinition>
}

export interface BlockSlotData {
  artifactId?: string
  versionTimestamp?: string
}

// END OF: site-blocks/types.ts
