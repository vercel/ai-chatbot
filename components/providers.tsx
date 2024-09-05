'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ClassProvider } from '@/lib/hooks/classContext' // Import the ClassProvider

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <SidebarProvider>
        <TooltipProvider>
          <ClassProvider> 
            {children}
          </ClassProvider>
        </TooltipProvider>
      </SidebarProvider>
    </NextThemesProvider>
  )
}
