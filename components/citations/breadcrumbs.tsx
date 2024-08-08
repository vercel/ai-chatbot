import React from 'react'
import { BreadcrumbSeparator } from './breadcrumb-separator'

interface BreadcrumbsProps {
  breadcrumbs: string[]
}

export function Breadcrumbs({ breadcrumbs }: BreadcrumbsProps) {
  return (
    <div className="truncate text-muted-foreground">
      <div className="inline">
        {breadcrumbs.map((breadcrumb, index) => (
          <React.Fragment key={index}>
            <div className="inline-block align-middle text-xs">
              {breadcrumb}
            </div>
            {index !== breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
