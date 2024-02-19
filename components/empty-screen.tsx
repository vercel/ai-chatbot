import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

const exampleMessages = [
  {
    heading: 'Explain what exactly is a Blockchain',
    message: `What is a "Blockchain"?`
  },
  {
    heading: 'Get me the transaction information for a wallet address',
    message: 'what is the transaction information for this wallet address'
  },
  {
    heading: 'What is OCADA',
    message: `What is OCADA ?`
  }
]

export function EmptyScreen({ setInput }: Pick<UseChatHelpers, 'setInput'>) {
  return (
    <div className="mx-auto lg:max-w-3xl px-4">
      <div className="rounded-lg py-8">
        <div className="mb-6">
          <h1 className="mb-2 text-4xl font-semibold text-type-600">
            Welcome to <span className=" text-theme-500 font-bold">OCADA</span>{' '}
            AI Agent!
          </h1>
          <p className="font-normal text-base leading-normal text-type-600 text-opacity-60">
            You can start a conversation here or try the following examples:
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(198px,1fr))] grid-flow-row auto-rows-fr gap-3 items-start min-h-48">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="bg-[#1e1e1e] h-full px-5 text-base font-normal py-4 rounded-xl mt-0 text-left flex-col items-start justify-between hover:no-underline text-type-600 text-opacity-75"
              onClick={() => setInput(message.message)}
            >
              {message.heading}
              <span className="w-full flex items-center justify-end">
                <i className="size-9 rounded-full flex justify-center items-center bg-[#171717] text-type-600">
                  <IconArrowRight className="text-muted-foreground" />
                </i>
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
