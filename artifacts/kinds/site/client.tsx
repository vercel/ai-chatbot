/**
 * @file artifacts/kinds/site/client.tsx
 * @description Редактор артефакта типа "Сайт".
 * @version 0.1.0
 * @date 2025-06-12
 * @updated Initial version.
 */

/** HISTORY:
 * v0.1.0 (2025-06-12): Initial version of site artifact editor.
 */

'use client'

import * as React from 'react'
import { Artifact } from '@/components/create-artifact'

interface BlockSlotData {
  artifactId?: string
  versionTimestamp?: string
}

interface SiteBlock {
  type: string
  slots: Record<string, BlockSlotData>
}

interface SiteDefinition {
  theme: string
  blocks: Array<SiteBlock>
}

type Metadata = undefined

export const siteArtifact = new Artifact<'site', Metadata>({
  kind: 'site',
  description: 'Site artifact editor',
  initialize: async () => {},
  onStreamPart: () => {},
  content: ({ content, onSaveContent }) => {
    const [definition, setDefinition] = React.useState<SiteDefinition>(() => {
      try {
        return content ? JSON.parse(content) : { theme: 'default', blocks: [] }
      } catch {
        return { theme: 'default', blocks: [] }
      }
    })

    const handleChange = (
      blockIndex: number,
      slot: string,
      field: 'artifactId' | 'versionTimestamp',
      value: string,
    ) => {
      setDefinition((prev) => {
        const next = { ...prev }
        next.blocks = [...prev.blocks]
        const blk = { ...next.blocks[blockIndex] }
        blk.slots = { ...blk.slots }
        blk.slots[slot] = { ...blk.slots[slot], [field]: value || undefined }
        next.blocks[blockIndex] = blk
        onSaveContent(JSON.stringify(next), true)
        return next
      })
    }

    return (
      <div className="space-y-4 p-4 text-sm">
        {definition.blocks.map((block, i) => (
          <div key={block.type} className="border p-2 rounded">
            <h4 className="font-medium mb-2">{block.type}</h4>
            {Object.entries(block.slots).map(([slotName, slot]) => (
              <div key={slotName} className="mb-2">
                <label htmlFor={`${block.type}-${slotName}-${i}`} className="block text-muted-foreground text-xs mb-1">
                  {slotName}
                </label>
                <input
                  id={`${block.type}-${slotName}-${i}`}
                  className="border rounded px-2 py-1 w-full mb-1"
                  placeholder="Artifact ID"
                  value={slot.artifactId || ''}
                  onChange={(e) =>
                    handleChange(i, slotName, 'artifactId', e.target.value)
                  }
                />
                <input
                  className="border rounded px-2 py-1 w-full"
                  placeholder="Version timestamp (optional)"
                  value={slot.versionTimestamp || ''}
                  onChange={(e) =>
                    handleChange(i, slotName, 'versionTimestamp', e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  },
  actions: [],
  toolbar: [],
})

// END OF: artifacts/kinds/site/client.tsx
