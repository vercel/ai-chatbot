import { UseChatHelpers } from 'ai/react'
import { Button } from '@/components/ui/button'
import { IconArrowRight } from '@/components/ui/icons'

// set proper example messages
const exampleMessages = [
  {
    heading: 'Generate a blog post',
    message: `Generate a blog post on how online donations can help parishes and non profits\n`
  },
  {
    heading: 'Write a facebook post',
    message: 'Write a facebook post about givecentral text to give features \n'
  },
  {
    heading: 'Draft an email',
    message: `Draft an email to send new year wishes to the donors \n`
  }
]

// Change UI
// - Choose model
// - Creative Mode
export function EmptyScreen({ setInput }: Pick<UseChatHelpers, 'setInput'>) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8">
        <h1 className="mb-2 text-lg font-semibold">
          Welcome to GC Guru!
        </h1>
        <p className="mb-2 leading-normal text-muted-foreground">
          I am here to help you have fun doing business with your data.
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
              onClick={() => setInput(message.message)}
            >
              <IconArrowRight className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
