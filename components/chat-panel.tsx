'use client'

import { UseChatHelpers } from 'ai-connector'
import { RefreshCcw, StopCircle } from 'lucide-react'

import { ExternalLink } from '@/components/external-link'
import { PromptForm } from '@/components/prompt-form'
import { Button } from '@/components/ui/button'

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
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-muted/10 from-10% to-muted/30 to-50%">
      <div className="sm:max-w-2xl sm:px-4 mx-auto">
        <div className="flex items-center justify-center py-2">
          {isLoading ? (
            <Button
              variant="outline"
              onClick={() => stop()}
              className="bg-background"
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Stop generating
            </Button>
          ) : (
            messages?.length > 0 && (
              <Button
                variant="outline"
                onClick={() => reload()}
                className="bg-background"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Regenerate response
              </Button>
            )
          )}
        </div>
        <div className="sm:p-4 border-t sm:border bg-background space-y-4 shadow-lg sm:rounded-t-xl">
          <PromptForm
            onSubmit={value => {
              append({
                content: value,
                role: 'user'
              })
            }}
            isLoading={isLoading}
          />
          <p className="hidden sm:block text-muted-foreground text-xs leading-normal text-center px-2">
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
