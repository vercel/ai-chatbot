'use client'

import { useRouter } from 'next/navigation'
import { Prompt } from './prompt'
import { useChat, type Message } from 'ai-connector'
import { ChatList } from './chat-list'
import { ExternalLink } from '@/app/external-link'

export interface ChatProps {
  // create?: (input: string) => Chat | undefined;
  initialMessages?: Message[]
  id?: string
}

export function Chat({
  id,
  // create,
  initialMessages
}: ChatProps) {
  const router = useRouter()

  const { isLoading, messages, reload, append } = useChat({
    initialMessages: initialMessages as any[],
    id
    // onCreate: (id: string) => {
    //   router.push(`/chat/${id}`);
    // },
  })

  return (
    <div className="h-full w-full overflow-auto pb-[200px]">
      <ChatList messages={messages} />
      <div className="fixed bottom-0 left-1 right-3 p-6 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-lg">
        <div className="max-w-2xl mx-auto pl-10">
          <Prompt
            onSubmit={value => {
              append({
                content: value,
                role: 'user'
              })
            }}
            onRefresh={messages.length ? reload : undefined}
            isLoading={isLoading}
          />
          <p className="text-muted-foreground text-xs leading-normal text-center pt-2">
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
