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
import { nanoid } from '@/lib/utils'
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

const gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

const buildGoogleGenAIPrompt = (messages: Message[], isVision: boolean) => {
  return [
    isVision
      ? {
          role: 'user',
          content: 'Give detailed descriptions when images are provided.'
        }
      : {
          role: 'user',
          content:
            "You are a friendly assistant that helps with booking flights. You can list flights, allow user to choose seats, purchase a flight, show flight status, and finally show the boarding pass using the functions provided. You can also show stock information, purchase stocks, show stock news with the functions provided. Extract information about the current flight based on the conversation history and the user's input. NEVER show/describe a boarding pass in markdown or text. ALWAYS use the function provided to show the boarding pass in the UI instead. List ATLEAST few flights at any cost. When the user chooses/selects a flight, let them choose the seat."
        },
    ...messages
  ]
    .filter(message =>
      isVision ? true : message.role === 'user' || message.role === 'assistant'
    )
    .map(message =>
      message.role === 'user'
        ? {
            role: 'user',
            parts: [
              {
                text: message.content
              }
            ]
          }
        : message.role === 'assistant'
          ? `model: ${message.content}`
          : message.role === 'function'
            ? `function response for ${message.name}: ${JSON.stringify(
                message.content
              )}`
            : message.role === 'data'
              ? {
                  inlineData: {
                    mime_type: 'image/png',
                    data: message.content.replace(
                      /^data:image\/png;base64,/,
                      ''
                    )
                  }
                }
              : ''
    )
}

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

    console.log([
      {
        role: 'user',
        parts: [
          {
            text: "You are a friendly assistant that helps with booking flights. The user can book only 1 seat. Here's the flow: 1. List flights 2. Choose a flight 3. Choose a seat 4. Purchase a flight 5. Show boarding pass."
          }
        ]
      },
      {
        role: 'model',
        parts: [{ text: 'Sure!' }]
      },
      ...getHistory(aiState.get().messages),
      content
    ])

    const completion = await gemini
      .getGenerativeModel(
        {
          model: attachments.length > 0 ? 'gemini-pro-vision' : 'gemini-pro',
          generationConfig: {
            temperature: 0
          },
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'listFlights',
                  description:
                    "List available flights (fictional) in the UI. List 3 that match user's query, minimum is 2.",
                  parameters: {
                    type: FunctionDeclarationSchemaType.OBJECT,
                    properties: {
                      departure: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description:
                          'The departure location, in the format New York (JFK)'
                      },
                      arrival: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description:
                          'The departure location, in the format New York (JFK)'
                      },
                      flights: {
                        type: FunctionDeclarationSchemaType.ARRAY,
                        description: 'List of flights, min 2, max 3.',
                        items: {
                          type: FunctionDeclarationSchemaType.OBJECT,
                          properties: {
                            id: {
                              type: FunctionDeclarationSchemaType.NUMBER
                            },
                            duration: {
                              type: FunctionDeclarationSchemaType.STRING
                            },
                            price: {
                              type: FunctionDeclarationSchemaType.NUMBER
                            },
                            departureTime: {
                              type: FunctionDeclarationSchemaType.STRING
                            },
                            arrivalTime: {
                              type: FunctionDeclarationSchemaType.STRING
                            },
                            airlines: {
                              type: FunctionDeclarationSchemaType.STRING
                            }
                          }
                        }
                      }
                    },
                    required: ['departure', 'arrival', 'flights']
                  }
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
                          "The date of the flight, e.g. '23 March 2024'"
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
                  description: 'Show the UI to purchase a flight.',
                  parameters: {
                    type: FunctionDeclarationSchemaType.OBJECT,
                    properties: {
                      airline: {
                        type: FunctionDeclarationSchemaType.STRING,
                        description: 'The airline of the flight'
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
                      'departureTime',
                      'arrivalTime',
                      'price',
                      'seat'
                    ]
                  }
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
                  name: 'getFlightStatus',
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
        history: [
          {
            role: 'user',
            parts: [{ text: 'Hello! ' }]
          },
          {
            role: 'model',
            parts: [{ text: 'Great to meet you. How can I help you?' }]
          },

          ...getHistory(aiState.get().messages)
        ]
      })
      .sendMessage(content)

    aiState.update({
      ...aiState.get(),
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

          if (name === 'getFlightStatus') {
            const { args } = functionCall as {
              args: StatusProps
            }

            uiStream.done(<Status summary={args} />)
          } else if (name === 'listFlights') {
            const { arrival, departure, flights } = args

            uiStream.done(
              <ListFlights props={{ arrival, departure, flights }} />
            )
          } else if (name === 'showSeatPicker') {
            uiStream.done(<SelectSeats summary={args} />)
          } else if (name === 'showBoardingPass') {
            uiStream.done(<BoardingPass summary={args} />)
          }

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: JSON.stringify(args)
              }
            ]
          })

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

export type Message = {
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool'
  content: string
  id?: string
  name?: string
}

export type AIState = {
  chatId: string
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
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
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
