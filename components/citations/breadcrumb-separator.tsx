import { IconCaretRight } from '../ui/icons'

export function BreadcrumbSeparator() {
  return (
    <div className="relative mx-1 inline-block align-middle text-muted-foreground/60">
      <IconCaretRight className="size-3" />
    </div>
  )
}
