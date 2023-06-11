import { ArrowRight } from 'lucide-react'

import { fontMessage } from '@/lib/fonts'
import { useChatStore } from '@/lib/hooks/use-chat-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'

const exampleMessages = [
  {
    heading: 'Explain technical concepts',
    message: `What is a "serverless function"?`
  },
  {
    heading: 'Summarize an article',
    message: 'Summarize the following article for a 2nd grader: \n'
  },
  {
    heading: 'Draft an email',
    message: `Draft an email to my boss about the following: \n`
  }
]

export function EmptyScreen({ className }: React.ComponentProps<'div'>) {
  const { setDefaultMessage } = useChatStore()

  return (
    <div
      className={cn(
        'rounded-lg border bg-background p-8',
        fontMessage.className,
        className
      )}
    >
      <h1 className="mb-2 text-lg font-semibold">
        Welcome to Next.js Chatbot!
      </h1>
      <p className="mb-2 leading-normal text-muted-foreground">
        This is an open source AI chatbot app built with{' '}
        <ExternalLink href="https://nextjs.org">Next.js</ExternalLink> and{' '}
        <ExternalLink href="https://vercel.com/storage/kv">
          Vercel KV
        </ExternalLink>
        .
      </p>
      <p className="leading-normal text-muted-foreground">
        You can start a conversation here or try the following examples:
      </p>
      <div className="mt-4 flex flex-col items-start space-y-2">
        {exampleMessages.map((message, index) => (
          <Button
            key={index}
            variant="link"
            className="h-auto p-0 text-base"
            onClick={() => setDefaultMessage(message.message)}
          >
            <ArrowRight className="mr-2 h-4 w-4 text-muted-foreground" />
            {message.heading}
          </Button>
        ))}
      </div>
    </div>
  )
}
