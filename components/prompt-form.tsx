'use client'

import * as React from 'react'
import { CornerDownLeft, Plus } from 'lucide-react'
import Textarea from 'react-textarea-autosize'

import { Button, buttonVariants } from '@/components/ui/button'
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
        <div className="relative flex w-full grow flex-col sm:rounded-md sm:border bg-background overflow-hidden px-12">
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
            className="min-h-[60px] sm:text-sm bg-transparent px-4 py-[1.4rem] focus-within:outline-none w-full resize-none"
          />
          <div className="absolute top-4 right-4">
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
