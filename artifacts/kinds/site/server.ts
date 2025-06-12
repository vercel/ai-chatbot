/**
 * @file artifacts/kinds/site/server.ts
 * @description Пустой обработчик для артефакта типа "Сайт".
 * @version 0.1.0
 * @date 2025-06-12
 * @updated Initial version.
 */

/** HISTORY:
 * v0.1.0 (2025-06-12): Initial placeholder implementation.
 */

import type { ArtifactTool } from '@/artifacts/kinds/artifact-tools'

export const siteTool: ArtifactTool = {
  kind: 'site',
  async create () {
    return ''
  },
  async update () {
    return ''
  },
}

// END OF: artifacts/kinds/site/server.ts
