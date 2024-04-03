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
import { FlightStatus } from '@/components/flights/flight-status'
import { SelectSeats } from '@/components/flights/select-seats'
import { ListFlights } from '@/components/flights/list-flights'
import { BoardingPass } from '@/components/flights/boarding-pass'
import { PurchaseTickets } from '@/components/flights/purchase-ticket'
import { CheckIcon, SpinnerIcon } from '@/components/ui/icons'
import { format } from 'date-fns'
import { experimental_streamText } from 'ai'
import { google } from 'ai/google'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
)

async function describeImage(imageBase64: string) {
  'use server'

  const aiState = getMutableAIState()
  const spinnerStream = createStreamableUI(null)
  const messageStream = createStreamableUI(null)
  const uiStream = createStreamableUI()

  uiStream.update(
    <BotCard>
      <div className="flex flex-col gap-2">
        <img className="rounded-lg" src={imageBase64} />
        <div className="flex flex-row gap-2 items-center">
          <SpinnerIcon />
          <div className="text-zinc-500 text-sm">Analyzing image...</div>
        </div>
      </div>
    </BotCard>
  )
  ;(async () => {
    const imageData = imageBase64.split(',')[1]
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' })
    const prompt = 'List the books in this image.'
    const image = {
      inlineData: {
        data: imageData,
        mimeType: 'image/png'
      }
    }

    const result = await model.generateContent([prompt, image])
    const text = result.response.text()

    spinnerStream.done(null)
    messageStream.done(null)

    uiStream.done(
      <BotCard>
        <img src={imageBase64} />
      </BotCard>
    )

    aiState.done({
      ...aiState.get(),
      interactions: [text]
    })
  })()

  return {
    id: nanoid(),
    attachments: uiStream.value,
    spinner: spinnerStream.value,
    display: messageStream.value
  }
}

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content: `${content}\n\n${aiState.get().interactions.join('\n\n')}`
      }
    ]
  })

  const history = aiState.get().messages.map(message => ({
    role: message.role,
    content: message.content
  }))

  console.log(history)

  const textStream = createStreamableValue('')
  const spinnerStream = createStreamableUI(<SpinnerMessage />)
  const messageStream = createStreamableUI(null)
  const uiStream = createStreamableUI()

  ;(async () => {
    const result = await experimental_streamText({
      model: google.generativeAI('models/gemini-1.0-pro-001'),
      temperature: 0,
      tools: {
        listDestinations: {
          description: 'List destination cities, max 5.',
          parameters: z.object({
            destinations: z.array(
              z.string().describe('List of destination cities.')
            )
          })
        },
        showFlights: {
          description:
            "List available flights in the UI. List 3 that match user's query.",
          parameters: z.object({
            departingCity: z.string(),
            arrivalCity: z.string(),
            departingAirport: z.string(),
            arrivalAirport: z.string(),
            date: z
              .string()
              .describe(
                "Date of the user's flight, example format: 6 April, 1998"
              )
          })
        },
        showSeatPicker: {
          description:
            'Show the UI to choose or change seat for the selected flight.',
          parameters: z.object({
            departingCity: z.string(),
            arrivalCity: z.string(),
            flightCode: z.string(),
            date: z.string()
          })
        },
        showPurchaseFlight: {
          description: 'Show the UI to purchase/checkout a flight booking.',
          parameters: z.object({})
        },
        showBoardingPass: {
          description: "Show user's imaginary boarding pass.",
          parameters: z.object({
            airline: z.string(),
            arrival: z.string(),
            departure: z.string(),
            departureTime: z.string(),
            arrivalTime: z.string(),
            price: z.number(),
            seat: z.string()
          })
        },
        showFlightStatus: {
          description:
            'Get the current status of flight by flight number and date.',
          parameters: z.object({
            flightCode: z.string(),
            date: z.string(),
            departingCity: z.string(),
            departingAirport: z.string(),
            departingAirportCode: z.string(),
            departingTime: z.string(),
            arrivalCity: z.string(),
            arrivalAirport: z.string(),
            arrivalAirportCode: z.string(),
            arrivalTime: z.string()
          })
        }
      },
      system: `\
      You are a friendly assistant that helps the user with booking flights to destinations that are based on a collection of books. You can you give travel recommendations based on the books, and will continue to help the user book a flight to their destination.
  
      The date today is ${format(new Date(), 'd LLLL, yyyy')}. 
      The user's current location is San Francisco, CA, so the departure city will be San Francisco and airport will be San Francisco International Airport (SFO).
      
      Here's the flow: 
        1. List holiday destinations based on a collection of books.
        2. List flights to destination.
        3. Choose a flight.
        4. Choose a seat.
        5. Purchase a flight.
        6. Show boarding pass.
      `,
      messages: [...history]
    })

    let textContent = ''

    for await (const delta of result.fullStream) {
      const { type } = delta

      if (type === 'text-delta') {
        const { textDelta } = delta
        textContent += textDelta
        messageStream.update(<BotMessage content={textContent} />)

        aiState.update({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content: textContent
            }
          ]
        })
      } else if (type === 'tool-call') {
        const { toolName, args } = delta

        if (toolName === 'listDestinations') {
          uiStream.done(
            <BotCard>
              <div className="flex flex-col gap-3 text-zinc-950">
                <div className="">
                  Here is a list of holiday destinations based on the books you
                  have read. Choose one to proceed to booking a flight.
                </div>
                <div className="">
                  {args.destinations.map(destination => (
                    <div key={destination}>{destination}</div>
                  ))}
                </div>
              </div>
            </BotCard>
          )

          aiState.done({
            ...aiState.get(),
            interactions: [],
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: `Here's a list of holiday destinations based on the books you've read. Choose one to proceed to booking a flight. \n\n ${args.destinations.join(', ')}.`
              }
            ]
          })
        } else if (toolName === 'showFlights') {
          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content:
                  "Here's a list of flights for you. Choose one and we can proceed to pick a seat."
              }
            ]
          })

          uiStream.done(
            <BotCard>
              <ListFlights summary={args} />
            </BotCard>
          )
        } else if (toolName === 'showSeatPicker') {
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

          uiStream.done(
            <BotCard>
              <SelectSeats summary={args} />
            </BotCard>
          )
        } else if (toolName === 'showPurchaseFlight') {
          uiStream.done(
            <BotCard>
              <PurchaseTickets />
            </BotCard>
          )
        } else if (toolName === 'showBoardingPass') {
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

          uiStream.done(
            <BotCard>
              <BoardingPass summary={args} />
            </BotCard>
          )
        } else if (toolName === 'showFlightStatus') {
          aiState.update({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: `The flight status of ${args.flightCode} is as follows:
                Departing: ${args.departingCity} at ${args.departingTime} from ${args.departingAirport} (${args.departingAirportCode})
                `
              }
            ]
          })

          uiStream.done(
            <BotCard>
              <FlightStatus summary={args} />
            </BotCard>
          )
        }
      }
    }

    aiState.done({
      ...aiState.get(),
      interactions: []
    })

    textStream.done()
    messageStream.done()
    spinnerStream.done(null)
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
      ...aiState.get().messages,
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
    validateCode,
    describeImage
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
  unstable_onSetAIState: async ({ state }) => {
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
