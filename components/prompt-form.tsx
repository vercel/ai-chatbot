'use client'

import * as React from 'react'
import Link from 'next/link'
import { CornerDownLeft, Plus } from 'lucide-react'
import Textarea from 'react-textarea-autosize'

import { useChatStore } from '@/lib/hooks/use-chat-store'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

export interface PromptProps {
  onSubmit: (value: string) => void
  isLoading: boolean
}

export function PromptForm({ onSubmit, isLoading }: PromptProps) {
  const { defaultMessage } = useChatStore()
  const [input, setInput] = React.useState(defaultMessage)
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
        if (input === '') {
          return
        }
        setInput('')
        await onSubmit(input)
      }}
      ref={formRef}
    >
      <TooltipProvider>
        <div className="relative flex w-full grow flex-col overflow-hidden bg-background px-8 sm:rounded-md sm:border sm:px-12">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                className={cn(
                  buttonVariants({ size: 'sm', variant: 'outline' }),
                  'absolute left-0 top-4 h-8 w-8 rounded-full bg-background p-0 sm:left-4'
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
            className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
          />
          <div className="absolute right-0 top-4 sm:right-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || input === ''}
                >
                  <CornerDownLeft className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send message</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    </form>
  )
}
