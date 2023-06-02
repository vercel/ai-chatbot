'use client'

import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'
import { useTransition } from 'react'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [_, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="xs"
      className="p-0 leading-4 h-4 font-normal w-full"
      onClick={() => {
        startTransition(() => {
          setTheme(theme === 'light' ? 'dark' : 'light')
        })
      }}
    >
      <span className="flex flex-row justify-between text-xs text-zinc-900 dark:text-zinc-400 w-full">
        <span className="">Toggle theme</span>
        {!theme ? null : theme === 'dark' ? (
          <Moon className="h-4 transition-all" />
        ) : (
          <Sun className="h-4 transition-all" />
        )}
      </span>
    </Button>
  )
}
