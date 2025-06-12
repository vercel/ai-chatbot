/**
 * @file site-blocks/hero/definition.ts
 * @description Определение блока Hero.
 * @version 0.1.0
 * @date 2025-06-12
 * @updated Initial version.
 */

/** HISTORY:
 * v0.1.0 (2025-06-12): Initial definition for hero block.
 */

import type { BlockDefinition } from '../types'

export const heroBlockDefinition: BlockDefinition = {
  type: 'hero',
  title: 'Hero',
  slots: {
    heading: { kind: 'text', tags: ['hero', 'heading'] },
    subheading: { kind: 'text', tags: ['hero', 'subheading'] },
    image: { kind: 'image', tags: ['hero', 'image'] },
  },
}

// END OF: site-blocks/hero/definition.ts
