/**
 * @file app/(site)/(hosting)/s/[siteId]/site-renderer.tsx
 * @description Client component that loads a site artifact and renders blocks.
 * @version 0.1.0
 * @date 2025-06-12
 * @updated Initial version.
 */

/** HISTORY:
 * v0.1.0 (2025-06-12): Initial version.
 */

'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/utils'
import { blockComponents } from '@/site-blocks'
import { Skeleton } from '@/components/ui/skeleton'

interface BlockSlotData {
  artifactId?: string
  versionTimestamp?: string
}

interface SiteDefinition {
  theme: string
  blocks: Array<{
    type: string
    slots: Record<string, BlockSlotData>
  }>
}

export function SiteRenderer ({ siteId }: { siteId: string }) {
  const { data, isLoading } = useSWR<any>(`/api/artifact?id=${siteId}`, fetcher)

  if (isLoading || !data) {
    return (
      <div className="p-8 space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-full" />
      </div>
    )
  }

  const siteArtifact = Array.isArray(data) ? data.at(-1) : data.doc
  const siteDefinition: SiteDefinition = siteArtifact?.content
    ? JSON.parse(siteArtifact.content)
    : { theme: 'default', blocks: [] }

  return (
    <div className="space-y-6">
      {siteDefinition.blocks.map((block, index) => {
        const Block = (blockComponents as any)[block.type]
        if (!Block) return null
        return <Block key={`${block.type}-${index}`} {...block.slots} />
      })}
    </div>
  )
}

export default SiteRenderer

// END OF: app/(site)/(hosting)/s/[siteId]/site-renderer.tsx
