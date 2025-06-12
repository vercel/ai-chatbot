/**
 * @file site-blocks/useful-links/index.tsx
 * @description Компонент блока Useful Links.
 * @version 0.1.0
 * @date 2025-06-12
 * @updated Initial version.
 */

/** HISTORY:
 * v0.1.0 (2025-06-12): Initial component.
 */

'use client'

import * as React from 'react'
import useSWR from 'swr'
import { parse } from 'papaparse'
import { fetcher } from '@/lib/utils'
import type { BlockSlotData } from '../types'
import { Skeleton } from '@/components/ui/skeleton'

export interface UsefulLinksProps {
  links?: BlockSlotData
}

export default function UsefulLinksBlock ({ links }: UsefulLinksProps) {
  const { data } = useSWR(
    links?.artifactId
      ? `/api/artifact?id=${links.artifactId}${links.versionTimestamp ? `&versionTimestamp=${links.versionTimestamp}` : ''}`
      : null,
    fetcher,
  )

  const parsedLinks: Array<{ label: string; url: string }> = React.useMemo(() => {
    const content = Array.isArray(data) ? data.at(-1)?.content : data?.doc.content
    if (content) {
      const parsed = parse<string[]>(content, { skipEmptyLines: true })
      return parsed.data.map((row) => ({ label: row[0], url: row[1] }))
    }
    return []
  }, [data])

  if (!data && links?.artifactId) {
    return <Skeleton className="h-20 w-full" />
  }

  return (
    <section>
      <h2 className="text-xl font-bold mb-2">Useful Links</h2>
      <ul className="list-disc pl-4 space-y-1">
        {parsedLinks.map((l) => (
          <li key={l.url}>
            <a href={l.url} className="text-primary underline">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

// END OF: site-blocks/useful-links/index.tsx
