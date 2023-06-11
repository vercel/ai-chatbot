import { ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { fontMessage } from '@/lib/fonts'
import { useChatStore } from '@/lib/hooks/use-chat-store'
import { ExternalLink } from '@/components/external-link'
import { Button } from '@/components/ui/button'

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
        'border bg-background p-8 rounded-lg',
        fontMessage.className,
        className
      )}
    >
      <h1 className="font-semibold text-lg mb-2">
        Welcome to Next.js Chatbot!
      </h1>
      <p className="text-muted-foreground leading-normal mb-2">
        This is an open source AI chatbot app built with{' '}
        <ExternalLink href="https://nextjs.org">Next.js</ExternalLink> and{' '}
        <ExternalLink href="https://vercel.com/storage/kv">
          Vercel KV
        </ExternalLink>
        .
      </p>
      <p className="text-muted-foreground leading-normal">
        You can start a conversation here or try the following examples:
      </p>
      <div className="mt-4 flex flex-col items-start space-y-2">
        {exampleMessages.map((message, index) => (
          <Button
            key={index}
            variant="link"
            className="p-0 h-auto text-base"
            onClick={() => setDefaultMessage(message.message)}
          >
            <ArrowRight className="w-4 h-4 mr-2 text-muted-foreground" />
            {message.heading}
          </Button>
        ))}
      </div>
    </div>
  )
}
