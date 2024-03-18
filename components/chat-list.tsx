import { Separator } from '@/components/ui/separator'
import { UIState } from '@/lib/chat/actions'
import { Session } from '@/lib/types'
import Link from 'next/link'

export interface ChatList {
  messages: UIState
  session?: Session
  isShared: boolean
}

export function ChatList({ messages, session, isShared }: ChatList) {
  if (!messages.length) {
    return null
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {!isShared && !session ? (
        <div className="mb-8 rounded-lg border bg-white p-4 dark:bg-zinc-950">
          <p className="text-muted-foreground leading-normal">
            Please{' '}
            <Link href="/login" className="underline">
              log in
            </Link>{' '}
            or{' '}
            <Link href="/signup" className="underline">
              sign up
            </Link>{' '}
            to save and revisit your chat history!
          </p>
        </div>
      ) : null}

      {messages.map((message, index) => (
        <div key={message.id}>
          {message.display}
          {index < messages.length - 1 && <Separator className="my-4" />}
        </div>
      ))}
    </div>
  )
}
