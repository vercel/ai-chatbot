import { Separator } from '@/components/ui/separator'
import { UIState } from '@/lib/chat/actions'
import { Session } from '@/lib/types'
import Link from 'next/link'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'

export interface ChatList {
  messages: UIState
  session?: Session
  isShared: boolean
}

export function ChatList({ messages, session, isShared }: ChatList) {
  if (!messages || messages.length === 0) {
    return null
  }

  return (
    <div className="w-11/12 mr-auto">
      {!isShared && !session ? (
        <>
          <div className="group relative mb-4 flex items-start">
            <div className="bg-background flex size-[25px] shrink-0 select-none items-center justify-center rounded-md border shadow-sm">
              <ExclamationTriangleIcon />
            </div>
            <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
              <p className="text-muted-foreground leading-normal">
                Please{' '}
                <Link href="/login" className="underline">
                  log in
                </Link>{' '}
                or{' '}
                <Link href="/signup" className="underline">
                  sign up
                </Link>{' '}
                to save and revisit your search history!
              </p>
            </div>
          </div>
        </>
      ) : null}

      {messages.map((message, index) => {
        return (
        <div key={message.id}>
          {message.display}
          {index < messages.length - 1 && <div className="my-4" />}
        </div>
      )})}
    </div>
  )
}
