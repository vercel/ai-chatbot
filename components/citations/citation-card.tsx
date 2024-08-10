import { ComponentType } from 'react'
import { Breadcrumbs } from './breadcrumbs'

interface CitationCardProps {
  title?: string | null
  url?: string | null
  Icon: ComponentType<{ className: string }>
  breadcrumbs?: string[]
  openInNewTab?: boolean
}

export function CitationCard({
  title = '',
  url,
  Icon,
  breadcrumbs = [],
  openInNewTab = true
}: CitationCardProps) {
  return (
    <a
      href={url || undefined}
      target={url && openInNewTab ? '_blank' : ''}
      rel="noreferrer"
      className="border-1 flex rounded-md border p-4 transition-colors duration-200 ease-in-out hover:bg-zinc-50"
    >
      <div className="flex shrink-0 items-center justify-center pr-3">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="flex min-w-0 max-w-full flex-col">
        <h3 className="truncate text-sm">{title}</h3>
        <div>
          <Breadcrumbs breadcrumbs={breadcrumbs} />
        </div>
      </div>
    </a>
  )
}
