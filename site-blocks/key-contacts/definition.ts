/**
 * @file site-blocks/key-contacts/definition.ts
 * @description Определение блока Key Contacts.
 * @version 0.1.0
 * @date 2025-06-12
 * @updated Initial version.
 */

/** HISTORY:
 * v0.1.0 (2025-06-12): Initial definition for key contacts block.
 */

import type { BlockDefinition } from '../types'

export const keyContactsBlockDefinition: BlockDefinition = {
  type: 'key-contacts',
  title: 'Key Contacts',
  slots: {
    contacts: { kind: 'sheet', tags: ['contacts'] },
  },
}

// END OF: site-blocks/key-contacts/definition.ts
