'use client'

import { UseChatHelpers } from 'ai-connector'
import { RefreshCcw, StopCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'

export interface ChatPanelProps
  extends Pick<
    UseChatHelpers,
    'append' | 'isLoading' | 'reload' | 'messages' | 'stop'
  > {
  id?: string
}

export function ChatPanel({
  isLoading,
  stop,
  append,
  reload,
  messages
}: ChatPanelProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 bg-gradient-to-b from-muted/10 from-10% to-muted/30 to-50%">
      <ButtonScrollToBottom />
      <div className="mx-auto sm:max-w-2xl sm:px-4">
        <div className="flex h-10 items-center justify-center">
          {isLoading ? (
            <Button
              variant="outline"
              onClick={() => stop()}
              className="bg-background"
            >
              <StopCircle className="mr-2 h-4 w-4" />
              Stop generating
            </Button>
          ) : (
            messages?.length > 0 && (
              <Button
                variant="outline"
                onClick={() => reload()}
                className="bg-background"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Regenerate response
              </Button>
            )
          )}
        </div>
        <div className="space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
          <PromptForm
            onSubmit={value => {
              append({
                content: value,
                role: 'user'
              })
            }}
            isLoading={isLoading}
          />
          <p className="hidden px-2 text-center text-xs leading-normal text-muted-foreground sm:block">
            Open source AI chatbot app built with{' '}
            <ExternalLink href="https://nextjs.org">Next.js</ExternalLink> and{' '}
            <ExternalLink href="https://vercel.com/storage/kv">
              Vercel KV
            </ExternalLink>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
