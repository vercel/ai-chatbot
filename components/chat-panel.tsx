'use client'

import { ExternalLink } from '@/components/external-link'
import { UseChatHelpers } from 'ai-connector'
import { PromptForm } from './prompt-form'

export interface ChatPanelProps
  extends Pick<UseChatHelpers, 'append' | 'isLoading' | 'reload' | 'messages'> {
  id?: string
}

export function ChatPanel({
  id,
  append,
  isLoading,
  reload,
  messages
}: ChatPanelProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0">
      <div className="max-w-2xl mx-auto">
        <div className="px-4 py-2 border space-y-4 shadow-lg bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-lg rounded-t-xl">
          <PromptForm
            onSubmit={value => {
              append({
                content: value,
                role: 'user'
              })
            }}
            onRefresh={messages.length ? reload : undefined}
            isLoading={isLoading}
          />
          <p className="text-muted-foreground text-xs leading-normal text-center pb-1">
            This is an open source AI chatbot app built with{' '}
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
