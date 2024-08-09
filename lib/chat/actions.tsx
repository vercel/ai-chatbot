import 'server-only'

import { createAI, createStreamableUI, getMutableAIState } from 'ai/rsc'
import { createOpenAI } from '@ai-sdk/openai'

import { nanoid } from '@/lib/utils'
import {
  FollowUpQuestionsSchema,
  IsProspectObj,
  LinksObj,
  NeedsHelpObj
} from '../inkeep-qa-schema'
import { ChatMessage } from '@/components/chat-message'
import { Message, streamObject } from 'ai'
import { z } from 'zod'
import { IconExternalLink } from '@/components/ui/icons'

const openai = createOpenAI({
  apiKey: process.env.INKEEP_API_KEY,
  baseURL: 'https://api.inkeep.com/v1'
})

async function submitUserMessage(content: string) {
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

  // You are a helpful AI assistant. Your primary goal is to provide accurate and relevant information to users based on the information sources you have.

  try {
    const result = await streamObject({
      model: openai('inkeep-context-gpt-4o'),
      system: `
        You are a helpful AI assistant for Inkeep. Your primary goal is to provide accurate and relevant information to users based on the information sources you have.

        Follow these guidelines:
        1. ALWAYS respond with message content in the "content" property.
        2. If you have links to relevant information, return a "LinksObj" object along with message content in the "content" property.
        3. If the user asks about access to the platform, pricing, plans, or costs, return a "IsProspectObj" object along with message content in the "content" property.
        4. If the user is not satisfied with the experience and needs help, support, or further assistance, return a "NeedsHelpObj" object along with message content in the "content" property.
        5. ALWAYS anticipate the user's next questions and provide them in the "followUpQuestions" property. DO NOT list or include these questions in the "content" property. These should be questions the user would ask next or that would be related to their previous questions. These need to be worded from the user's perspective.
        5. Maintain a friendly and professional tone.
        6. Prioritize user satisfaction and clarity in your responses.
      `,
      messages: [
        ...aiState.get().messages.map((message: any) => ({
          role: message.role,
          content: message.content,
          name: 'inkeep-context-user-message',
          id: message.id
        }))
      ],
      mode: 'json',
      schema: z.object({
        LinksObj: LinksObj.nullish(),
        IsProspectObj: IsProspectObj.nullish(),
        NeedsHelpObj: NeedsHelpObj.nullish(),
        content: z
          .string()
          .describe('REQUIRED response message content')
          .nullish(),
        followUpQuestions: FollowUpQuestionsSchema.nullish()
      })
    })

    const { partialObjectStream } = result
    const chatMessage = createStreamableUI()

    runAsyncFnWithoutBlocking(async () => {
      let fullToolCall = {
        IsProspectObj: {},
        NeedsHelpObj: {},
        LinksObj: {}
      }

      const fullResponseMessageId = nanoid()
      let fullResponseMessage = {
        id: fullResponseMessageId,
        content: '',
        role: 'assistant'
      } as Message

      let followUpQuestions: string[] = []

      for await (const partialStream of partialObjectStream) {
        let responseMessage = {
          ...fullResponseMessage
        }
        if (partialStream.content) {
          responseMessage.content = partialStream.content
        }

        const messageToShow = <ChatMessage message={responseMessage} />
        chatMessage.update(messageToShow)

        if (partialStream.IsProspectObj) {
          fullToolCall.IsProspectObj = partialStream.IsProspectObj
        } else if (partialStream.NeedsHelpObj) {
          fullToolCall.NeedsHelpObj = partialStream.NeedsHelpObj
        } else if (partialStream.LinksObj) {
          fullToolCall.LinksObj = partialStream.LinksObj
        }

        if (
          partialStream.followUpQuestions &&
          partialStream.followUpQuestions.length > 0
        ) {
          followUpQuestions = partialStream.followUpQuestions.filter(
            question => question !== undefined
          )
        }

        fullResponseMessage = responseMessage
      }

      const finalUIChatMessage = getFinalUI(
        fullResponseMessage,
        fullToolCall,
        followUpQuestions
      )

      chatMessage.done(finalUIChatMessage)

      aiState.done({
        ...aiState.get(),
        messages: [
          ...aiState.get().messages,
          {
            id: fullResponseMessageId,
            role: 'assistant',
            content: fullResponseMessage.content
          }
        ]
      })
    })

    return {
      id: nanoid(),
      display: chatMessage.value
    }
  } catch (error) {
    console.log('Error:', error)
    aiState.done({
      ...aiState.get()
    })
    return {
      id: nanoid(),
      display: null
    }
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

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] }
})

const runAsyncFnWithoutBlocking = (fn: (...args: any) => Promise<any>) => {
  fn()
}

const getFinalUI = (
  fullResponseMessage: any,
  toolCall: any,
  followUpQuestions: string[]
): React.ReactNode => {
  if (Object.keys(toolCall.NeedsHelpObj).length > 0) {
    return (
      <ChatMessage
        message={fullResponseMessage}
        customInfoCard={<HelpCard />}
        followUpQuestions={followUpQuestions}
      />
    )
  }

  if (Object.keys(toolCall.IsProspectObj).length > 0) {
    return (
      <ChatMessage
        message={fullResponseMessage}
        customInfoCard={<IsProspectCard />}
        followUpQuestions={followUpQuestions}
      />
    )
  }

  if (Object.keys(toolCall.LinksObj).length > 0) {
    const toolParsed = LinksObj.safeParse(toolCall.LinksObj)

    return (
      <ChatMessage
        message={fullResponseMessage}
        links={toolParsed.data?.links}
        followUpQuestions={followUpQuestions}
      />
    )
  }

  return (
    <ChatMessage
      message={fullResponseMessage}
      followUpQuestions={followUpQuestions}
    />
  )
}

function HelpCard() {
  return (
    <div className="pt-8">
      <h3 className="text-sm text-muted-foreground">Sources</h3>
      <div className="mt-3 flex flex-col gap-3">
        <a
          href="https://inkeep.com"
          target="_blank"
          rel="noreferrer"
          className="border-1 flex rounded-md border p-4 transition-colors duration-200 ease-in-out hover:bg-gray-50"
        >
          <div className="flex shrink-0 items-center justify-center pr-3">
            <IconExternalLink className="size-4 text-muted-foreground" />
          </div>
          <div className="flex min-w-0 max-w-full flex-col">
            <h3 className="truncate text-sm">Contact Inkeep for assistance</h3>
          </div>
        </a>
      </div>
    </div>
  )
}

function IsProspectCard() {
  return (
    <div className="pt-8">
      <h3 className="text-sm text-muted-foreground">Sources</h3>
      <div className="mt-3 flex flex-col gap-3">
        <a
          href="https://inkeep.com"
          target="_blank"
          rel="noreferrer"
          className="border-1 flex rounded-md border p-4 transition-colors duration-200 ease-in-out hover:bg-gray-50"
        >
          <div className="flex shrink-0 items-center justify-center pr-3">
            <IconExternalLink className="size-4 text-muted-foreground" />
          </div>
          <div className="flex min-w-0 max-w-full flex-col">
            <h3 className="truncate text-sm">
              Thanks for your interest in Inkeep! Contact us here.
            </h3>
          </div>
        </a>
      </div>
    </div>
  )
}
