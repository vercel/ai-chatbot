import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { runAsyncFnWithoutBlocking, sleep, nanoid } from '@/lib/utils'
import { saveChat } from '@/app/actions'
import {
  SpinnerMessage,
  UserMessage,
  SystemMessage,
  BotCard,
  BotMessage
} from '@/components/chat/message'
import { Chat, Message } from '@/lib/types'
import { auth } from '@/auth'
import { InteractiveCalendar } from '@/components/calendar/calendar'

async function confirmEvent({
  name,
  location,
  start,
  end,
  invitees
}: {
  name: string
  location?: string
  start: string
  end: string
  invitees?: string[]
}) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  const creatingEvent = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      <p className="mb-2">Scheduling...</p>
    </div>
  )

  const systemMessage = createStreamableUI(null)

  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000)

    creatingEvent.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        <p className="mb-2">Scheduling... working on it...</p>
      </div>
    )

    await sleep(1000)

    creatingEvent.done(
      <div>
        <p className="mb-2">
          {name} scheduled for {start} to {end} at {location}.
        </p>
      </div>
    )

    systemMessage.done(
      <SystemMessage>
        You have scheduled {name} for {start} to {end} at {location}.
      </SystemMessage>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'system',
          content: `[User has scheduled an event: ${name} from ${start} to ${end} at ${location} with {invites.length} invitees]`
        }
      ]
    })
  })

  return {
    schedulingUI: creatingEvent.value,
    newMessage: {
      id: nanoid(),
      display: systemMessage.value
    }
  }
}

async function submitUserMessage(content: string): Promise<{
  id: string
  display: React.ReactNode
}> {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const result = await streamUI({
    model: openai('gpt-3.5-turbo'),
    initial: <SpinnerMessage />,
    system: `\
    You are a helpful assistant and you help users schedule meetings, step by step.
    You and the user can discuss when, where, and with whom the user wants to schedule a meeting with,
    and the user can pick the day, duration, time, participants, and confirm the meeting in the UI.

    Today's date is ${new Date().toLocaleDateString()}.
        
    If the user asks to schedule an event or a meeting, first ask the user what it will be for.
    Then, call \`show_event_creation_ui\` to show the event creation UI.
    If the user mentioned a date and/or time, pre-fill the date and time in the UI.
    Pre-fill the event name with a suggestion based on the user's input.
    Pre-fill the event location if the user mentioned it.
    If the user wants to confirm the meeting, call \`confirm_meeting\` to show and finalize the meeting details.`,
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    },
    tools: {
      showCalendar: {
        description:
          'Show UI to view calendar and create an event. Use this if the user wants to create or schedule an event or meeting.',
        parameters: z.object({
          name: z.string().describe('The name of the event'),
          location: z.string().optional().describe('The location of the event'),
          start: z
            .string()
            .optional()
            .describe('The start DateTime of the event'),
          end: z.string().optional().describe('The end DateTime of the event')
        }),
        generate: async function ({ name, location, start, end }) {
          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'showCalendar',
                    toolCallId,
                    args: {
                      name,
                      location,
                      start,
                      end,
                      status: 'draft'
                    }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'showCalendar',
                    toolCallId,
                    result: { status: 'completed' }
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <InteractiveCalendar
                props={{
                  name,
                  location,
                  start,
                  end,
                  status: 'draft'
                }}
              />
            </BotCard>
          )
        }
      }
    }
  })

  return {
    id: nanoid(),
    display: result.value
  }
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

type Actions = {
  submitUserMessage: (
    content: string
  ) => Promise<{ id: string; display: React.ReactNode }>
  confirmEvent: typeof confirmEvent
}

export const AI = createAI<AIState, UIState, Actions>({
  actions: {
    submitUserMessage,
    confirmEvent
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState()

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  onSetAIState: async ({ state }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`

      const firstMessageContent = messages[0].content as string
      const title = firstMessageContent.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'tool' ? (
          message.content.map(tool => {
            return tool.toolName === 'showCalendar' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <InteractiveCalendar props={tool.result} />
              </BotCard>
            ) : null
          })
        ) : message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null
    }))
}
