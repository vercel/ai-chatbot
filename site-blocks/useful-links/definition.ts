/**
 * @file site-blocks/useful-links/definition.ts
 * @description Определение блока Useful Links.
 * @version 0.1.0
 * @date 2025-06-12
 * @updated Initial version.
 */

/** HISTORY:
 * v0.1.0 (2025-06-12): Initial definition for useful links block.
 */

import type { BlockDefinition } from '../types'

export const usefulLinksBlockDefinition: BlockDefinition = {
  type: 'useful-links',
  title: 'Useful Links',
  slots: {
    links: { kind: 'sheet', tags: ['links'] },
  },
}

// END OF: site-blocks/useful-links/definition.ts
