import { cn } from '@/lib/utils'
import { ExternalLink } from './external-link'
import { ArrowRight } from 'lucide-react'
import { useChatStore } from '@/hooks/use-chat-store'
import { Button } from '@/components/ui/button'
import { OpenAI } from '@/components/icons'

const exampleMessages = [
  {
    heading: 'Explain technical concepts',
    message: `What is a "serverless function"?`
  },
  {
    heading: 'Summarize article',
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
    <div className="flex items-start space-x-4 mb-4">
      <div
        className={cn(
          'flex h-8 w-8 -ml-2 shrink-0 items-center justify-center rounded-full select-none border bg-primary text-primary-foreground'
        )}
      >
        <OpenAI className="w-4 h-4" />
      </div>
      <div
        className={cn(
          'border rounded-lg flex-1 p-10 bg-gradient-to-b from-background via-muted/10 to-muted/50',
          className
        )}
      >
        <h1 className="font-semibold mb-2">Welcome to Next.js Chatbot!</h1>
        <p className="text-muted-foreground text-sm leading-normal">
          This is an open source AI chatbot app built with{' '}
          <ExternalLink href="https://nextjs.org">Next.js</ExternalLink> and{' '}
          <ExternalLink href="https://vercel.com/storage/kv">
            Vercel KV
          </ExternalLink>
          .
        </p>
        <p className="text-muted-foreground text-sm leading-normal">
          You can start a conversation here or try the following examples:
        </p>
        <div className="text-sm mt-4 flex flex-col items-start space-y-2">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="p-0 h-auto"
              onClick={() => setDefaultMessage(message.message)}
            >
              <ArrowRight className="w-4 h-4 mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
