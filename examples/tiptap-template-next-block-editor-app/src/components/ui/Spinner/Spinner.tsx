import { cn } from '@/lib/utils'
import { HTMLProps, forwardRef } from 'react'

export const Spinner = forwardRef<HTMLDivElement, HTMLProps<HTMLDivElement>>(({ className, ...rest }, ref) => {
  const spinnerClass = cn('animate-spin rounded-full border-2 border-current border-t-transparent h-4 w-4', className)

  return <div className={spinnerClass} ref={ref} {...rest} />
})

Spinner.displayName = 'Spinner'
