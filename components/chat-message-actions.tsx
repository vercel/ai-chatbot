'use client'

import { Button } from '@/components/ui/button'
import { IconCheck, IconCopy } from '@/components/ui/icons'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'
import { type Message } from 'ai-connector'

interface ChatMessageActionsProps extends React.ComponentProps<'div'> {
  message: Message
}

export function ChatMessageActions({
  message,
  className,
  ...props
}: ChatMessageActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })

  return (
    <div
      className={cn(
        'flex items-center justify-end w-full md:absolute md:-top-2 md:-right-10 md:opacity-0 group-hover:opacity-100 transition-opacity',
        className
      )}
      {...props}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => copyToClipboard(message.content)}
      >
        {isCopied ? <IconCheck /> : <IconCopy />}
        <span className="sr-only">Copy message</span>
      </Button>
    </div>
  )
}
