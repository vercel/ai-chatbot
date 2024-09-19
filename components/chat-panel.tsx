import * as React from 'react'

import { shareChat } from '@/app/actions'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { ChatShareDialog } from '@/components/chat-share-dialog'
import { FooterText } from '@/components/footer'
import { PromptForm } from '@/components/prompt-form'
import { Button } from '@/components/ui/button'
import { IconShare } from '@/components/ui/icons'
import type { AI } from '@/lib/chat/actions'
import { useAIState, useActions, useUIState } from 'ai/rsc'
import { nanoid } from 'nanoid'
import { RibbonBotMessage, SpinnerMessage, UserMessage } from './stocks/message'

export interface ChatPanelProps {
  id?: string
  title?: string
  input: string
  setInput: (value: string) => void
  isAtBottom: boolean
  scrollToBottom: () => void
}

export function ChatPanel({
  id,
  title,
  input,
  setInput,
  isAtBottom,
  scrollToBottom
}: ChatPanelProps) {
  const [aiState] = useAIState()
  const [messages, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)

  const exampleMessages: {
    heading: string
    subheading: string
    message: string
  }[] = [
    {
      heading: 'SBC Core Call Leg Overview',
      subheading: 'What is a call leg in SBC core?',
      message: `What is a call leg in SBC core?`
    },
    {
      heading: 'Integrating DSC SWe into IP Network',
      subheading: 'How do I integrate DSC SWe into my IP Network for Ribbon Network?',
      message: 'How do I integrate DSC SWe into my IP Network for Ribbon Network?'
    },
    {
      heading: 'Adding a VPN Tunnel in EdgeMarc',
      subheading: 'How do I add a VPN tunnel in EdgeMarc for Ribbon Networks?',
      message: `How do I add a VPN tunnel in EdgeMarc for Ribbon Networks?`
    },
    {
      heading: 'EdgeView SCC Installation Requirements',
      subheading: `What are the installation requirements EdgeView SCC?`,
      message: `What are the installation requirements EdgeView SCC?`
    }
  ]

  return (
    <div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b from-muted/30 from-0% to-muted/30 to-50% duration-300 ease-in-out animate-in dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
      <ButtonScrollToBottom
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />

      <div className="mx-auto sm:max-w-2xl sm:px-4">
        <div className="mb-4 grid grid-cols-2 gap-2 px-4 sm:px-0">
          {messages.length === 0 &&
            exampleMessages.map((example, index) => (
              <div
                key={example.heading}
                className={`cursor-pointer rounded-lg border bg-white p-4 hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 ${
                  index > 1 && 'hidden md:block'
                }`}
                onClick={async () => {
                  setMessages(currentMessages => [
                    ...currentMessages.filter(message => !React.isValidElement(message.display) || message.display.type !== SpinnerMessage),
                    {
                      id: nanoid(),
                      display: <UserMessage>{example.message}</UserMessage>
                    },
                    {
                      id: nanoid(),
                      display: <SpinnerMessage />,
                      // type: 'spinner'
                    }
                  ])

                  const responseMessage = await submitUserMessage(
                    example.message
                  )

                  // setMessages(currentMessages => [
                  //   ...currentMessages,
                  //   responseMessage
                  // ])
                  setMessages(currentMessages => [
                    ...currentMessages.filter(message => !React.isValidElement(message.display) || message.display.type !== SpinnerMessage),
                    {
                      id: nanoid(),
                      display: <RibbonBotMessage children={responseMessage.display} />
                    }
                  ])

                  // setMessages(currentMessages => [...currentMessages.slice(0, -1), {
                  //   id: nanoid(),
                  //   display: <RibbonBotMessage children={responseMessage.display} />
                  // }])

                }}
              >
                <div className="text-sm font-semibold">{example.heading}</div>
                <div className="text-sm text-zinc-600">
                  {example.subheading}
                </div>
              </div>
            ))}
        </div>

        {messages?.length >= 2 ? (
          <div className="flex h-12 items-center justify-center">
            <div className="flex space-x-2">
              {id && title ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <IconShare className="mr-2" />
                    Share
                  </Button>
                  <ChatShareDialog
                    open={shareDialogOpen}
                    onOpenChange={setShareDialogOpen}
                    onCopy={() => setShareDialogOpen(false)}
                    shareChat={shareChat}
                    chat={{
                      id,
                      title,
                      messages: aiState.messages
                    }}
                  />
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
          <PromptForm input={input} setInput={setInput} />
          <FooterText className="hidden sm:block" />
        </div>
      </div>
    </div>
  )
}
