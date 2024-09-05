'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ClassProvider } from '@/lib/hooks/class-context'
import { BackgroundProvider } from '@/lib/hooks/background-context'

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <SidebarProvider>
        <TooltipProvider>
          <ClassProvider>
            <BackgroundProvider>{children}</BackgroundProvider>
          </ClassProvider>
        </TooltipProvider>
      </SidebarProvider>
    </NextThemesProvider>
  )
}
