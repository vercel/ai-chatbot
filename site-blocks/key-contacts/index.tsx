/**
 * @file site-blocks/key-contacts/index.tsx
 * @description Компонент блока Key Contacts.
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

export interface KeyContactsProps {
  contacts?: BlockSlotData
}

export default function KeyContactsBlock ({ contacts }: KeyContactsProps) {
  const { data } = useSWR(
    contacts?.artifactId
      ? `/api/artifact?id=${contacts.artifactId}${contacts.versionTimestamp ? `&versionTimestamp=${contacts.versionTimestamp}` : ''}`
      : null,
    fetcher,
  )

  const contactRows: Array<{ name: string; email?: string; phone?: string }> = React.useMemo(() => {
    const content = Array.isArray(data) ? data.at(-1)?.content : data?.doc.content
    if (content) {
      const parsed = parse<string[]>(content, { skipEmptyLines: true })
      return parsed.data.map((row) => ({ name: row[0], email: row[1], phone: row[2] }))
    }
    return []
  }, [data])

  if (!data && contacts?.artifactId) {
    return <Skeleton className="h-20 w-full" />
  }

  return (
    <section>
      <h2 className="text-xl font-bold mb-2">Key Contacts</h2>
      <ul className="space-y-1">
        {contactRows.map((c) => (
          <li key={c.email ?? c.name}>
            {c.name}
            {c.email ? ` - ${c.email}` : ''}
            {c.phone ? ` - ${c.phone}` : ''}
          </li>
        ))}
      </ul>
    </section>
  )
}

// END OF: site-blocks/key-contacts/index.tsx
