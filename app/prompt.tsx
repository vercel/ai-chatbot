'use client'

import * as React from 'react'
import { CornerDownLeft, RefreshCcw, StopCircle } from 'lucide-react'
import { useState } from 'react'
import Textarea from 'react-textarea-autosize'

import { Button } from '@/components/ui/button'
import { fontMessage } from '@/lib/fonts'
import { useCmdEnterSubmit } from '@/lib/hooks/use-command-enter-submit'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/hooks/use-chat-store'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

export interface PromptProps {
  onSubmit: (value: string) => void
  onRefresh?: () => void
  onAbort?: () => void
  isLoading: boolean
}

export function Prompt({
  onSubmit,
  onRefresh,
  onAbort,
  isLoading
}: PromptProps) {
  const { defaultMessage } = useChatStore()
  const [input, setInput] = useState(defaultMessage)
  const { formRef, onKeyDown } = useCmdEnterSubmit()
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
            {/* <button
                      id="share-button"
                      className="btn btn-neutral flex justify-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="h-3 w-3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                        />
                      </svg>
                      Share
                    </button> */}
          </div>
        </div>
        <div className="relative flex w-full grow flex-col rounded-md border bg-background overflow-hidden pr-12">
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
              'min-h-[60px] text-sm p-4 bg-transparent focus-within:outline-none w-full resize-none',
              fontMessage.className
            )}
          />
          <div className="absolute top-4 right-4">
            <TooltipProvider>
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
                    <Button
                      variant="ghost"
                      type="submit"
                      className="h-8 w-8 p-0"
                    >
                      <CornerDownLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Send message</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </div>
      </div>
    </form>
  )
}
