import React from 'react'

import { cn } from '@/lib/utils'

export function FooterText({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'px-2 text-center text-xs leading-normal text-muted-foreground',
        className
      )}
      {...props}
    >
      This guidance is not a substitute for professional assistance. If you find
      that your training isn&apos;t enjoyable or effective, or if you require
      further support, please seek out a qualified trainer for help.
    </p>
  )
}
