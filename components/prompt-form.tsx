'use client'

import * as React from 'react'
import { CornerDownLeft, Plus, RefreshCcw, StopCircle } from 'lucide-react'
import { useState } from 'react'
import Textarea from 'react-textarea-autosize'

import { Button, buttonVariants } from '@/components/ui/button'
import { fontMessage } from '@/lib/fonts'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/lib/hooks/use-chat-store'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import Link from 'next/link'

export interface PromptProps {
  onSubmit: (value: string) => void
  onRefresh?: () => void
  onAbort?: () => void
  isLoading: boolean
}

export function PromptForm({
  onSubmit,
  onRefresh,
  onAbort,
  isLoading
}: PromptProps) {
  const { defaultMessage } = useChatStore()
  const [input, setInput] = useState(defaultMessage)
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  React.useEffect(() => {
    setInput(defaultMessage)
  }, [defaultMessage])

  return (
    <form
      onSubmit={async e => {
        e.preventDefault()
        setInput('')
        await onSubmit(input)
      }}
      ref={formRef}
    >
      <div className="relative flex h-full flex-1 flex-row-reverse items-stretch md:flex-col">
        <div>
          <div className="ml-1 flex h-full justify-center gap-0 md:m-auto md:mb-2 md:w-full md:gap-2">
            {onRefresh ? (
              <Button
                variant="ghost"
                className="relative border-0 h-full md:h-auto px-3 md:border bg-white dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400"
                onClick={onRefresh}
              >
                <div className="flex h-gull w-full items-center justify-center gap-2">
                  <RefreshCcw className="h-4 w-4 text-zinc-500 md:h-3 md:w-3" />
                  <span className="hidden md:block">Regenerate response</span>
                </div>
              </Button>
            ) : null}
          </div>
        </div>
        <TooltipProvider>
          <div className="relative flex w-full grow flex-col rounded-md border bg-background overflow-hidden px-12">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/"
                  className={cn(
                    buttonVariants({ size: 'sm', variant: 'outline' }),
                    'w-8 h-8 p-0 rounded-full absolute top-4 left-4 bg-background'
                  )}
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">New Chat</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent>New Chat</TooltipContent>
            </Tooltip>
            <Textarea
              ref={inputRef}
              tabIndex={0}
              onKeyDown={onKeyDown}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Send a message."
              spellCheck={false}
              className={cn(
                'min-h-[60px] text-sm bg-transparent px-4 py-[1.4rem] focus-within:outline-none w-full resize-none',
                fontMessage.className
              )}
            />
            <div className="absolute top-4 right-4">
              {isLoading ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={onAbort}
                      className="h-8 w-8 p-0"
                    >
                      <StopCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Stop generating</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="submit" className="h-8 w-8 p-0">
                      <CornerDownLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Send message</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </TooltipProvider>
      </div>
    </form>
  )
}
