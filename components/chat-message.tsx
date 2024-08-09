// Inspired by Chatbot-UI and modified to fit the needs of this project
// @see https://github.com/mckaywrigley/chatbot-ui/blob/main/components/Chat/ChatMessage.tsx

import React from 'react'
import type { Message } from 'ai'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { cn } from '@/lib/utils'
import { CodeBlock } from '@/components/ui/codeblock'
import { MemoizedReactMarkdown } from '@/components/markdown'
import { IconVercel, IconUser, IconExternalLink } from '@/components/ui/icons'
import { ChatMessageActions } from '@/components/chat-message-actions'
import { Citations } from './citations/citations'
import type { z } from 'zod'
import { LinksSchema } from '@/lib/inkeep-qa-schema'
import { FollowUpQuestionsCards } from './followup-questions'

export interface ChatMessageProps {
  message: Message
  links?: z.infer<typeof LinksSchema> | null
  customInfoCard?: React.ReactNode
  followUpQuestions?: string[]
}

export function ChatMessage({
  message,
  links,
  customInfoCard,
  followUpQuestions,
  ...props
}: ChatMessageProps) {
  return (
    <div
      className={cn('group relative mb-4 flex items-start md:-ml-12')}
      {...props}
    >
      <div
        className={cn(
          'flex size-8 shrink-0 select-none items-center justify-center rounded-md border shadow',
          message.role === 'user'
            ? 'bg-background'
            : 'bg-primary text-primary-foreground'
        )}
      >
        {message.role === 'user' ? <IconUser /> : <IconVercel />}
      </div>
      <div className="flex-1 px-1 ml-4 space-y-2 overflow-hidden">
        <MemoizedReactMarkdown
          className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
          remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            p({ children }) {
              return <p className="mb-2 last:mb-0">{children}</p>
            },
            code({ node, inline, className, children, ...props }) {
              if (children.length) {
                if (children[0] == '▍') {
                  return (
                    <span className="mt-1 cursor-default animate-pulse">▍</span>
                  )
                }

                children[0] = (children[0] as string).replace('`▍`', '▍')
              }

              const match = /language-(\w+)/.exec(className || '')

              if (inline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }

              return (
                <CodeBlock
                  key={Math.random()}
                  language={(match && match[1]) || ''}
                  value={String(children).replace(/\n$/, '')}
                  {...props}
                />
              )
            },
            a({ href, children, ...props }) {
              const childArray = React.Children.toArray(children)
              const child = childArray[0]

              // Check if the child is in format of (integer) e.g. `(1)` and is the only child
              const isCitation =
                typeof child === 'string' &&
                /^\(\d+\)$/.test(child) &&
                childArray.length === 1

              if (isCitation) {
                const citationNumber = child.match(/\d+/) // extract the number
                return (
                  <sup className="ml-1 cursor-pointer">
                    <a
                      target="_blank"
                      className="cursor-pointer font-bold text-[0.625rem] leading-[0.75rem] px-[3px] py-[2px] rounded-sm bg-zinc-200 no-underline dark:text-primary-foreground"
                      href={href}
                    >
                      {citationNumber}
                    </a>
                  </sup>
                )
              } else {
                return (
                  <a href={href} {...props}>
                    {children}
                  </a>
                )
              }
            }
          }}
        >
          {message.content}
        </MemoizedReactMarkdown>
        {links && links.length > 0 && <Citations links={links} />}
        {customInfoCard}
        <FollowUpQuestionsCards followUpQuestions={followUpQuestions ?? []} />
        <ChatMessageActions message={message} />
      </div>
    </div>
  )
}
