'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { IconChevronUpDown } from '@/components/ui/icons'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'

export function DropdownMenuModel() {
  const [model, setModel] = useLocalStorage('model', 'gpt-3.5-turbo')
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="pl-0">
          <span className="pl-4">
            {model === 'gpt-4' ? 'GPT 4' : 'GPT 3.5'}
          </span>{' '}
          <IconChevronUpDown className="inline" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={8} align="start" className="w-[300px]">
        <DropdownMenuItem
          className="flex-col items-start gap-2"
          onClick={() => setModel('gpt-4')}
        >
          <div className="text-xs font-medium">GPT 4</div>
          <div className="text-xs text-zinc-500">For the best answers.</div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex-col items-start gap-2"
          onClick={() => setModel('gpt-3.5-turbo')}
        >
          <div className="text-xs font-medium">GPT 3.5</div>
          <div className="text-xs text-zinc-500">
            Great for system related questions.
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
