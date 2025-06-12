/**
 * @file site-blocks/hero/index.tsx
 * @description Базовый React-компонент блока Hero.
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
import { fetcher } from '@/lib/utils'
import type { BlockSlotData } from '../types'
import { Skeleton } from '@/components/ui/skeleton'

export interface HeroBlockProps {
  heading?: BlockSlotData
  subheading?: BlockSlotData
  image?: BlockSlotData
}
export default function HeroBlock ({ heading, subheading, image }: HeroBlockProps) {
  const { data: headingData } = useSWR(
    heading?.artifactId
      ? `/api/artifact?id=${heading.artifactId}${heading.versionTimestamp ? `&versionTimestamp=${heading.versionTimestamp}` : ''}`
      : null,
    fetcher,
  )
  const { data: subheadingData } = useSWR(
    subheading?.artifactId
      ? `/api/artifact?id=${subheading.artifactId}${subheading.versionTimestamp ? `&versionTimestamp=${subheading.versionTimestamp}` : ''}`
      : null,
    fetcher,
  )
  const { data: imageData } = useSWR(
    image?.artifactId
      ? `/api/artifact?id=${image.artifactId}${image.versionTimestamp ? `&versionTimestamp=${image.versionTimestamp}` : ''}`
      : null,
    fetcher,
  )

  const headingContent = Array.isArray(headingData)
    ? headingData.at(-1)?.content
    : headingData?.doc.content
  const subheadingContent = Array.isArray(subheadingData)
    ? subheadingData.at(-1)?.content
    : subheadingData?.doc.content
  const imageUrl = Array.isArray(imageData)
    ? imageData.at(-1)?.content
    : imageData?.doc.content

  return (
    <section className="py-8 text-center">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="mx-auto mb-4" />
      ) : image?.artifactId ? (
        <Skeleton className="h-48 w-full max-w-md mx-auto mb-4" />
      ) : null}
      {headingContent ? (
        <h1 className="text-3xl font-bold mb-2">{headingContent}</h1>
      ) : heading?.artifactId ? (
        <Skeleton className="h-8 w-1/2 mx-auto mb-2" />
      ) : null}
      {subheadingContent ? (
        <p className="text-muted-foreground">{subheadingContent}</p>
      ) : subheading?.artifactId ? (
        <Skeleton className="h-5 w-1/3 mx-auto" />
      ) : null}
    </section>
  )
}

// END OF: site-blocks/hero/index.tsx
