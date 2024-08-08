import 'server-only'

import { createAI, createStreamableUI, getMutableAIState } from 'ai/rsc'
import { createOpenAI } from '@ai-sdk/openai'

import { nanoid } from '@/lib/utils'
import { FollowUpQuestionsSchema, IsProspectObj, LinksObj, NeedsHelpObj } from '../inkeep-qa-schema'
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

  const chatMessage = createStreamableUI()

  const result = await streamObject({
    model: openai('inkeep-context-gpt-4o'),
    system: `
      You are a helpful AI assistant for Inkeep. Your primary goal is to provide accurate and relevant information to users based on the information sources you have.

      Follow these guidelines:
      1. Always return a response message with the "content" property.
      2. If you have a good response along with links to relevant information, return the "LinksObj" object to provide the links to the user.
      3. If the user asks about access to the platform, pricing, plans, or costs, return the "IsProspectObj" object.
      4. If the user is not satisfied with the experience and needs help, support, or further assistance, return the "NeedsHelpObj" object.
      5. Anticipate the user's next questions and provide them in the "followUpQuestions" property. These should be questions the user would ask next or that would be related to their previous questions. These need to be worded from the user's perspective.
      5. Always maintain a friendly and professional tone.
      6. Prioritize user satisfaction and clarity in your responses.
    `,
      // 2. If the user's question is vague or lacks specificity, use the "gatherMoreContext" tool to gather more context. 
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: 'inkeep-context-user-message',
        id: message.id
      }))
    ],
    schema: z.object({
      // toolCall: z.union([LinksObj, IsProspectObj, NeedsHelpObj]),
      LinksObj: LinksObj.nullish(),
      IsProspectObj: IsProspectObj.nullish(),
      NeedsHelpObj: NeedsHelpObj.nullish(),
      content: z.string().describe('response message content'),
      followUpQuestions: FollowUpQuestionsSchema.nullish()
    }).partial(),
    // text: ({ content }) => {
    //   console.log('text', { content })
    //   const assistantAnswerMessage = {
    //     id: answerMessageId,
    //     role: 'assistant',
    //     content,
    //     name: 'inkeep-context-assistant-message'
    //   } as Message

    //   const currentMessages = aiState.get().messages
    //   const lastMessage = currentMessages[currentMessages.length - 1]

    //   aiState.update({
    //     ...aiState.get(),
    //     messages:
    //       lastMessage.role === 'assistant' && lastMessage?.id === answerMessageId
    //         ? [...currentMessages.slice(0, -1), assistantAnswerMessage]
    //         : [...currentMessages, assistantAnswerMessage]
    //   })

    //   return <ChatMessage message={assistantAnswerMessage} />
    // },
    // tools: {
    //   provideLinks: {
    //     ...LinksObj,
    //     generate: async ({ links }) => {
    //       console.log('provideLinks', { links })
    //       const currentMessages = aiState.get().messages
    //       const lastMessage = currentMessages[currentMessages.length - 1]
    //       const lastMessageWithToolResults = {
    //         ...lastMessage,
    //         toolInvocations: [
    //           {
    //             toolName: 'provideLinks',
    //             result: links
    //           }
    //         ]
    //       } as Message

    //       aiState.done({
    //         ...aiState.get(),
    //         messages: [
    //           ...currentMessages.slice(0, -1),
    //           lastMessageWithToolResults
    //         ]
    //       })

    //       return <ChatMessage message={lastMessage} links={links} />
    //     }
    //   },
    //   isProspect: {
    //     ...IsProspectObj,
    //     generate: async ({ subjectMatter }) => {
    //       console.log('isProspect', { subjectMatter })

    //       const currentMessages = aiState.get().messages
    //       const lastMessage = currentMessages[currentMessages.length - 1]
    //       const lastMessageWithToolResults = {
    //         ...lastMessage,
    //         toolInvocations: [
    //           {
    //             toolName: 'isProspect',
    //             result: subjectMatter
    //           }
    //         ]
    //       } as Message

    //       aiState.done({
    //         ...aiState.get(),
    //         messages: [
    //           ...currentMessages.slice(0, -1),
    //           lastMessageWithToolResults
    //         ]
    //       })


    //       return (
    //         <div>
    //           An Inkeep team member is happy to help you on {subjectMatter}. 
    //           Click here to find Inkeep's contact information.
    //         </div>
    //       )
    //     }
    //   },
    //   needsHelp: {
    //     ...NeedsHelpObj,
    //     generate: async ({ subjectMatter }) => {
    //       console.log('needsHelp', { subjectMatter })

    //       const currentMessages = aiState.get().messages
    //       const lastMessage = currentMessages[currentMessages.length - 1]
    //       const lastMessageWithToolResults = {
    //         ...lastMessage,
    //         toolInvocations: [
    //           {
    //             toolName: 'needsHelp',
    //             result: subjectMatter
    //           }
    //         ]
    //       } as Message

    //       aiState.done({
    //         ...aiState.get(),
    //         messages: [
    //           ...currentMessages.slice(0, -1),
    //           lastMessageWithToolResults
    //         ]
    //       })

    //       return (
    //         <div>
    //           An Inkeep team member is better suited to help you with your question related to {subjectMatter}. 
    //           Click here to find Inkeep's contact information.
    //         </div>
    //       )
    //     }
    //   }
    // },
    // toolChoice: 'auto'
  })

  const { partialObjectStream } = result

  runAsyncFnWithoutBlocking(async () => {
    let fullToolCall = {
      IsProspectObj: {},
      NeedsHelpObj: {},
      LinksObj: {},
    }
    
    const fullResponseMessageId = nanoid()
    let fullResponseMessage = {
      id: fullResponseMessageId,
      content: '',
      role: 'assistant'
    } as Message

    let followUpQuestions: string[] = []

    for await (const partialStream of partialObjectStream) {
      const responseMessage = {
        ...fullResponseMessage,
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

      if (partialStream.followUpQuestions && partialStream.followUpQuestions.length > 0) {
        followUpQuestions = partialStream.followUpQuestions.filter(question => question !== undefined)
      }
      
      fullResponseMessage = responseMessage
    }

    const finalUIChatMessage = getFinalUI(fullResponseMessage, fullToolCall, followUpQuestions)

    chatMessage.done(
      finalUIChatMessage
    )

    aiState.done(
      {
        ...aiState.get(),
        messages: [
          ...aiState.get().messages,
          {
            id: fullResponseMessageId,
            role: 'assistant',
            content: fullResponseMessage.content
          }
        ]
      }
    )
  })

  return {
    id: nanoid(),
    display: chatMessage.value
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

const runAsyncFnWithoutBlocking = (
  fn: (...args: any) => Promise<any>
) => {
  fn()
}

const getFinalUI = (fullResponseMessage: any, toolCall: any, followUpQuestions: string[]) => {
  if (Object.keys(toolCall.NeedsHelpObj).length > 0) {
    return <ChatMessage message={fullResponseMessage} customCardInfo={<HelpCard />} followUpQuestions={followUpQuestions} />
  }

  if (Object.keys(toolCall.IsProspectObj).length > 0) {
    return <ChatMessage message={fullResponseMessage} customCardInfo={<IsProspectCard />} followUpQuestions={followUpQuestions} />
  }

  if (Object.keys(toolCall.LinksObj).length > 0) {
    const toolParsed = LinksObj.safeParse(toolCall.LinksObj)

    return <ChatMessage message={fullResponseMessage} links={toolParsed.data?.parameters.links} followUpQuestions={followUpQuestions} />
  }
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
            <h3 className="truncate text-sm">Contact Inkeep</h3>
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
            <h3 className="truncate text-sm">Thanks for your interest in Inkeep! Contact us here.</h3>
          </div>
        </a>
      </div>
    </div>
  )
}
