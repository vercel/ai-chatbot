/**
 * @file site-blocks/index.ts
 * @description Реестр блоков сайта и их определений.
 * @version 0.1.0
 * @date 2025-06-12
 * @updated Initial version with three MVP blocks.
 */

/** HISTORY:
 * v0.1.0 (2025-06-12): Initial version with hero, key-contacts and useful-links.
 */

import type { BlockDefinition } from './types'
import HeroBlock from './hero'
import { heroBlockDefinition } from './hero/definition'
import KeyContactsBlock from './key-contacts'
import { keyContactsBlockDefinition } from './key-contacts/definition'
import UsefulLinksBlock from './useful-links'
import { usefulLinksBlockDefinition } from './useful-links/definition'

export const blockDefinitions: Record<string, BlockDefinition> = {
  hero: heroBlockDefinition,
  'key-contacts': keyContactsBlockDefinition,
  'useful-links': usefulLinksBlockDefinition,
}

export const blockComponents = {
  hero: HeroBlock,
  'key-contacts': KeyContactsBlock,
  'useful-links': UsefulLinksBlock,
}

export type { BlockDefinition } from './types'

// END OF: site-blocks/index.ts
