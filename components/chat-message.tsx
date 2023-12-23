import { Message } from 'ai'
import { cn } from '@/lib/utils'
import { Markdown } from '@/components/markdown'
import { IconOpenAI, IconUser } from '@/components/ui/icons'
import { ChatMessageActions } from '@/components/chat-message-actions'

import { DataView } from './data-view'

export interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message, ...props }: ChatMessageProps) {
  return (
    <div
      className={cn('group relative mb-4 flex items-start md:-ml-12')}
      {...props}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow',
          message.role === 'user'
            ? 'bg-background'
            : 'bg-primary text-primary-foreground'
        )}
      >
        {message.role === 'user' ? <IconUser /> : <IconOpenAI />}
      </div>
      <div className="flex-1 px-1 ml-4 space-y-2 overflow-hidden">
        {message.role === 'user' ? (
          <Markdown>{message.content}</Markdown>
        ) : message.ui != null ? (
          message.ui
        ) : message?.data != null ? (
          <div>
            <DataView data={message.data} content={message.content} />
          </div>
        ) : (
          <>{message.content}</>
        )}
        <ChatMessageActions message={message} />
      </div>
    </div>
  )
}
