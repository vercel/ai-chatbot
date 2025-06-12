/**
 * @file artifacts/kinds/artifact-tools.ts
 * @description Центральный реестр (barrel file) для инструментов-обработчиков артефактов.
 * @version 1.2.0
 * @date 2025-06-12
 * @updated Added siteTool to registry.
 */

/** HISTORY:
 * v1.2.0 (2025-06-12): Added siteTool to registry.
 * v1.1.0 (2025-06-10): Импорт ArtifactKind теперь из lib/types.
 * v1.0.0 (2025-06-10): Initial version. Defines the ArtifactTool contract and exports all available tools.
 */
import type { Session } from 'next-auth'
import type { Artifact } from '@/lib/db/schema'
import type { ArtifactKind } from '@/lib/types' // <-- ИЗМЕНЕН ИМПОРТ
// Import individual tools
import { textTool } from './text/server'
import { codeTool } from './code/server'
import { imageTool } from './image/server'
import { sheetTool } from './sheet/server'
import { siteTool } from './site/server'

/**
 * @interface ArtifactTool
 * @description Defines the "contract" for an artifact tool. Each method is optional,
 * allowing for default behavior to be implemented at the call site if a specific method is not provided.
 */
export interface ArtifactTool {
  kind: ArtifactKind;
  create?: (props: {
    id: string,
    title: string,
    prompt: string,
    session: Session
  }) => Promise<string>;
  update?: (props: {
    document: Artifact,
    description: string,
    session: Session
  }) => Promise<string>;
  // enhance, delete, restore are optional for future expansion.
}

/**
 * @const {ArtifactTool[]} artifactTools
 * @description An array of all available artifact tools. This serves as a central registry
 * for the system to find and dispatch tasks to the correct handler based on artifact kind.
 */
export const artifactTools: ArtifactTool[] = [
  textTool,
  codeTool,
  imageTool,
  sheetTool,
  siteTool,
]

// END OF: artifacts/kinds/artifact-tools.ts
