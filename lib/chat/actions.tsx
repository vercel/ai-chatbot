// @ts-nocheck

/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  createStreamableValue
} from 'ai/rsc'

import { BotCard, BotMessage, Stock, Purchase } from '@/components/stocks'

import { Events } from '@/components/stocks/events'
import { Stocks } from '@/components/stocks/stocks'
import { nanoid, sleep } from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat } from '../types'
import { auth } from '@/auth'
import {
  FunctionDeclarationSchemaType,
  GoogleGenerativeAI
} from '@google/generative-ai'
import { Status, StatusProps } from '@/components/flights/status'
import { SelectSeats } from '@/components/flights/select-seats'
import { ListFlights } from '@/components/flights/list-flights'
import { BoardingPass } from '@/components/flights/boarding-pass'
import { PurchaseTickets } from '@/components/flights/purchase-ticket'
import { CheckIcon, SpinnerIcon } from '@/components/ui/icons'
import { format } from 'date-fns'

const gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

const getHistory = (messages: Message[]) => {
  return messages.map(message =>
    message.role === 'user'
      ? {
          role: 'user',
          parts: [{ text: message.content }]
        }
      : message.role === 'assistant'
        ? message.functionCall
          ? {
              role: 'model',
              parts: [
                {
                  functionCall: {
                    name: message.functionCall.name,

                    args: message.functionCall.content
                  }
                }
              ]
            }
          : {
              role: 'model',
              parts: [{ text: message.content }]
            }
        : ''
  )
}

async function submitUserMessage(content: string) {
  'use server'

  const attachments = []

  const images = attachments.map(attachment => ({
    role: 'data',
    content: attachment.replace(/^data:image\/png;base64,/, '')
  }))

  const textStream = createStreamableValue('')
  const spinnerStream = createStreamableUI(<SpinnerMessage />)
  const messageStream = createStreamableUI(null)
  const uiStream = createStreamableUI()

  ;(async () => {
    const aiState = getMutableAIState()

    const history = [
      {
        role: 'user',
        parts: [
          {
            text: `You are a friendly assistant that helps the user with booking flights. The date today is ${format(new Date(), 'd LLLL, yyyy')}. Here's the flow: 1. List flights 2. Choose a flight 3. Choose a seat 4. Purchase a flight.`
          }
        ]
      },
      {
        role: 'model',
        parts: [{ text: 'Great! How can I help you?' }]
      },
      ...getHistory(aiState.get().messages)
    ]

    const completion = await gemini
      .getGenerativeModel(
        {
          model: 'gemini-pro',
          generationConfig: {
            temperature: 0
          },
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'listFlights',
                  description: 'List available flights.'
                },
                {
                  name: 'showSeatPicker',
                  description:
                    'Show the UI to choose or change seat for the selected flight. This is shown after choosing a flight from the list to book.',
                  parameters: {
                    type: FunctionDeclarationSchemaType.OBJECT,
                    properties: {
                      departingCity: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The departure city'
                      },
                      arrivalCity: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The arrival city'
                      },
                      flightCode: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The flight code'
                      },
                      date: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description:
                          "The date of the flight, in format '23 March 2024'"
                      }
                    },
                    required: [
                      'departingCity',
                      'arrivalCity',
                      'flightCode',
                      'date'
                    ]
                  }
                },
                {
                  name: 'showPurchaseFlight',
                  description:
                    'Show the UI to purchase/checkout a flight booking. This happens after choosing a seat.'
                },
                {
                  name: 'showBoardingPass',
                  description: "Show user's imaginary boarding pass.",
                  parameters: {
                    type: FunctionDeclarationSchemaType.OBJECT,
                    properties: {
                      airline: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The airline of the flight'
                      },
                      arrival: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The arrival city of the flight'
                      },
                      departure: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The departure city of the flight'
                      },
                      departureTime: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The departure time of the flight'
                      },
                      arrivalTime: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The arrival time of the flight'
                      },
                      price: {
                        type: FunctionDeclarationSchemaType.NUMBER,
                        description: 'The price of the flight'
                      },
                      seat: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The seat of the flight'
                      }
                    },
                    required: [
                      'airline',
                      'arrival',
                      'departure',
                      'departureTime',
                      'arrivalTime',
                      'price',
                      'seat'
                    ]
                  }
                },
                {
                  name: 'showFlightStatus',
                  description:
                    'Get the current status of flight by flight number and date.',
                  parameters: {
                    type: FunctionDeclarationSchemaType.OBJECT,
                    properties: {
                      flightCode: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The flight number'
                      },
                      date: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The date of the flight in YYYY-MM-DD'
                      },
                      departingCity: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The departure city'
                      },
                      departingAirport: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The departure airport'
                      },
                      departingAirportCode: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The departure airport code'
                      },
                      departingTime: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The departure time'
                      },
                      arrivalCity: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The arrival city'
                      },
                      arrivalAirport: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The arrival airport'
                      },
                      arrivalAirportCode: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The arrival airport code'
                      },
                      arrivalTime: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The arrival time'
                      }
                    },
                    required: [
                      'flightCode',
                      'date',
                      'departingCity',
                      'departingAirport',
                      'departingAirportCode',
                      'departingTime',
                      'arrivalCity',
                      'arrivalAirport',
                      'arrivalAirportCode',
                      'arrivalTime'
                    ]
                  }
                }
              ]
            }
          ]
        },
        { apiVersion: 'v1beta' }
      )
      .startChat({
        history
      })
      .sendMessage(`${aiState.get().interactions.join('. ')} ${content}`)

    aiState.update({
      ...aiState.get(),
      interactions: [],
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'user',
          content
        },
        ...images
      ]
    })

    const { candidates } = completion.response

    // is text completion
    if (candidates) {
      const candidate = candidates[0]
      const { content } = candidate
      const { parts } = content

      if (parts) {
        const part = parts[0]
        const { text, functionCall } = part

        // is text completion
        if (text) {
          const assistantResponse =
            completion.response.candidates && completion.response.candidates[0]
              ? completion.response.candidates[0].content.parts[0].text
              : ''

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: assistantResponse
              }
            ]
          })

          messageStream.done(<BotMessage content={assistantResponse || ''} />)
          uiStream.done()
          textStream.done()
          spinnerStream.done(null)
        } else if (functionCall) {
          const { name, args } = functionCall

          if (name === 'showFlightStatus') {
            const { args } = functionCall as {
              args: StatusProps
            }

            uiStream.done(<Status summary={args} />)
          } else if (name === 'listFlights') {
            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content:
                    "Here's a list of flights for you. Choose one and we can proceed to picking a seat."
                }
              ]
            })

            uiStream.done(<ListFlights />)
          } else if (name === 'showPurchaseFlight') {
            uiStream.done(<PurchaseTickets props={args} />)
          } else if (name === 'showSeatPicker') {
            const { args } = functionCall

            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content:
                    "Here's a list of available seats for you to choose from. Select one to proceed to payment."
                }
              ]
            })

            uiStream.done(<SelectSeats summary={args} />)
          } else if (name === 'showBoardingPass') {
            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content:
                    "Here's your boarding pass. Please have it ready for your flight."
                }
              ]
            })

            uiStream.done(<BoardingPass summary={args} />)
          }

          textStream.done()
          messageStream.done()
          spinnerStream.done(null)
        }
      }
    }
  })()

  return {
    id: nanoid(),
    attachments: uiStream.value,
    spinner: spinnerStream.value,
    display: messageStream.value
  }
}

export async function requestCode() {
  'use server'

  const aiState = getMutableAIState()

  aiState.done({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages.slice(0, -1),
      {
        role: 'assistant',
        content:
          "A code has been sent to user's phone. They should enter it in the user interface to continue."
      }
    ]
  })

  const ui = createStreamableUI(
    <div className="animate-spin">
      <SpinnerIcon />
    </div>
  )

  ;(async () => {
    await sleep(2000)
    ui.done()
  })()

  return {
    status: 'requires_code',
    display: ui.value
  }
}

export async function validateCode() {
  'use server'

  const aiState = getMutableAIState()

  const status = createStreamableValue('in_progress')
  const ui = createStreamableUI(
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-zinc-500">
      <div className="animate-spin">
        <SpinnerIcon />
      </div>
      <div className="text-sm text-zinc-500">
        Please wait while we fulfill your order.
      </div>
    </div>
  )

  ;(async () => {
    await sleep(2000)

    ui.update(
      <div className="flex flex-col items-center justify-center gap-3 p-4 text-emerald-700">
        <CheckIcon />
        <div>Payment Succeeded</div>
        <div className="text-sm text-zinc-500">
          Thanks for your purchase! You will receive an email confirmation
          shortly.
        </div>
      </div>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages.slice(0, -1),
        {
          role: 'assistant',
          content: 'The purchase has completed successfully.'
        }
      ]
    })

    status.update('completed')
  })()

  return {
    status: status.value,
    display: ui.value
  }
}

export type Message = {
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool'
  content: string
  id?: string
  name?: string
}

export type AIState = {
  chatId: string
  interactions?: string[]
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
  spinner?: React.ReactNode
  attachments?: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
    requestCode,
    validateCode
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), interactions: [], messages: [] },
  unstable_onGetUIState: async () => {
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
  unstable_onSetAIState: async ({ state, done }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`
      const title = messages[0].content.substring(0, 100)

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
        message.role === 'function' ? (
          message.name === 'listStocks' ? (
            <BotCard>
              <Stocks props={JSON.parse(message.content)} />
            </BotCard>
          ) : message.name === 'showStockPrice' ? (
            <BotCard>
              <Stock props={JSON.parse(message.content)} />
            </BotCard>
          ) : message.name === 'showStockPurchase' ? (
            <BotCard>
              <Purchase props={JSON.parse(message.content)} />
            </BotCard>
          ) : message.name === 'getEvents' ? (
            <BotCard>
              <Events props={JSON.parse(message.content)} />
            </BotCard>
          ) : null
        ) : message.role === 'user' ? (
          <UserMessage showAvatar>{message.content}</UserMessage>
        ) : (
          <BotMessage content={message.content} />
        )
    }))
}
