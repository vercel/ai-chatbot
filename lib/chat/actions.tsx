import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { createAzure } from '@ai-sdk/azure'
import { LanguageModel } from 'ai'

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage,
  Stock,
  Purchase
} from '@/components/stocks'

import { z } from 'zod'
import { EventsSkeleton } from '@/components/stocks/events-skeleton'
import { Events } from '@/components/stocks/events'
import { StocksSkeleton } from '@/components/stocks/stocks-skeleton'
import { Stocks } from '@/components/stocks/stocks'
import { StockSkeleton } from '@/components/stocks/stock-skeleton'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid,
  isObjectEmpty
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat, Message } from '@/lib/types'
import { AZURE_DEPLOYMENT_NAME, AZURE_RESOURCE_NAME } from '@/lib/constant'
import { auth } from '@/auth'

import {
  fetchYoutubeDuration,
  extractYouTubeVideoIdFromUrl,
  getYoutubeEmbedLink
} from '@/lib/youtube'

import ConversionPage from '@/components/ConversionPage'
import { fetchEvent } from '@/lib/apis/event'
import { PartialEventResponse } from '@/lib/models/Event'
import { downloadFile } from '../apis/download'

const azureApiKey = process.env['AZURE_OPENAI_API_KEY']

const azure = createAzure({
  resourceName: AZURE_RESOURCE_NAME, // Azure resource name
  apiKey: azureApiKey
})

const renderErrorUI = (id: string) => {
  return (
    <BotCard>
      <div>Failed to fetch conversion event with id: {id}</div>
    </BotCard>
  )
}

// async function confirmPurchase(symbol: string, price: number, amount: number) {
//   'use server'

//   const aiState = getMutableAIState<typeof AI>()

//   const purchasing = createStreamableUI(
//     <div className="inline-flex items-start gap-1 md:items-center">
//       {spinner}
//       <p className="mb-2">
//         Purchasing {amount} ${symbol}...
//       </p>
//     </div>
//   )

//   const systemMessage = createStreamableUI(null)

//   runAsyncFnWithoutBlocking(async () => {
//     await sleep(1000)

//     purchasing.update(
//       <div className="inline-flex items-start gap-1 md:items-center">
//         {spinner}
//         <p className="mb-2">
//           Purchasing {amount} ${symbol}... working on it...
//         </p>
//       </div>
//     )

//     await sleep(1000)

//     purchasing.done(
//       <div>
//         <p className="mb-2">
//           You have successfully purchased {amount} ${symbol}. Total cost:{' '}
//           {formatNumber(amount * price)}
//         </p>
//       </div>
//     )

//     systemMessage.done(
//       <SystemMessage>
//         You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
//         {formatNumber(amount * price)}.
//       </SystemMessage>
//     )

//     aiState.done({
//       ...aiState.get(),
//       messages: [
//         ...aiState.get().messages,
//         {
//           id: nanoid(),
//           role: 'system',
//           content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${
//             amount * price
//           }]`
//         }
//       ]
//     })
//   })

//   return {
//     purchasingUI: purchasing.value,
//     newMessage: {
//       id: nanoid(),
//       display: systemMessage.value
//     }
//   }
// }

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

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const result = await streamUI({
    model: azure(AZURE_DEPLOYMENT_NAME) as LanguageModel,
    initial: <SpinnerMessage />,
    system: `\
    You are an AI music conversation bot and your main mission is to help users get youtube video length.
    
    If the user requests getting youtube video length, call \`get_youtube_length\` to get youtube video length in seconds.
    
    Besides that, you can also chat with users and do some calculations if needed.`,
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
      getYoutubeLength: {
        description: 'Fetch youtube video length in seconds.',
        parameters: z.object({
          youtubeUrl: z.string().describe('The youtube video url'),
          durationInSeconds: z
            .number()
            .describe('The youtube video duration in seconds')
        }),
        generate: async function* ({ youtubeUrl }) {
          yield (
            <BotCard>
              <StocksSkeleton />
            </BotCard>
          )

          await sleep(1000)

          const videoId = extractYouTubeVideoIdFromUrl(youtubeUrl)
          console.log('🚀 ~ submitUserMessage ~ videoId:', videoId)

          if (!youtubeUrl || !videoId) {
            return (
              <BotCard>
                <div>Invalid youtube url</div>
              </BotCard>
            )
          }

          const { durationInSeconds: duration } =
            await fetchYoutubeDuration(videoId)
          console.log('🚀 ~ submitUserMessage ~ duration:', duration)

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
                    toolName: 'getYoutubeLength',
                    toolCallId,
                    args: { duration }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'getYoutubeLength',
                    toolCallId,
                    result: {
                      durationInSeconds: duration
                    }
                  }
                ]
              }
            ]
          })

          const youtubeEmbedUrl = getYoutubeEmbedLink(youtubeUrl)

          return (
            <BotCard>
              <div className="mb-4 aspect-[1920/1080] w-full max-w-[850px] border-2">
                <iframe
                  src={youtubeEmbedUrl}
                  // eslint-disable-next-line tailwindcss/enforces-shorthand
                  className="h-full w-full border-0"
                  allowFullScreen
                />
              </div>
              <div className="border-2 p-4 rounded-lg">
                youtube duration: {duration}
              </div>
            </BotCard>
          )
        }
      },
      getConversionEvent: {
        description:
          'Fetch voice conversion result by conversionId and show ConversionPage UI component',
        parameters: z.object({
          conversionId: z.string().describe('The voice conversion id')
        }),
        generate: async function* ({ conversionId }) {
          yield (
            <BotCard>
              <StocksSkeleton />
            </BotCard>
          )

          console.log('🚀 ~ submitUserMessage ~ conversionId:', conversionId)

          await sleep(1000)

          let eventResponse: PartialEventResponse
          let isEmptyResponse: boolean

          try {
            eventResponse = await fetchEvent({ eventId: conversionId })
            console.log('🚀 ~ timer=setTimeout ~ eventResponse:', eventResponse)

            isEmptyResponse = isObjectEmpty(eventResponse)

            if (isEmptyResponse) return renderErrorUI(conversionId)
          } catch (e) {
            return renderErrorUI(conversionId)
          }

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
                    toolName: 'getConversionEvent',
                    toolCallId,
                    args: { conversionId }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'getConversionEvent',
                    toolCallId,
                    result: {
                      conversionId
                    }
                  }
                ]
              }
            ]
          })

          const totalJobCounts = eventResponse?.jobs?.length || 0
          const finishedStepCounts = Object.keys(
            eventResponse?.results || {}
          ).length

          const hasFinishedProcessing =
            !isEmptyResponse && finishedStepCounts === totalJobCounts

          const hasSucceed =
            hasFinishedProcessing &&
            eventResponse?.states?.every(state =>
              isObjectEmpty(state?.exception || {})
            )

          if (hasSucceed) {
            const sourceAudioLink =
              eventResponse?.results?.step_5?.files?.[1]?.path ||
              eventResponse?.results?.step_1?.files?.[0]?.path
            // TODO: will break if there is more steps
            const convertedAudioLink =
              eventResponse?.results?.step_5?.files?.[0]?.path ||
              eventResponse?.results?.step_4?.files?.[0]?.path

            const modelLabel =
              eventResponse?.results?.step_3?.files?.[0]?.label?.split(
                '_'
              )[0] || ''

            const originUrl = eventResponse?.jobs?.[0]?.files?.[0]?.path || ''

            try {
              const [sourceAudioUrl, convertedAudioUrl] = await Promise.all([
                downloadFile({ file_path: sourceAudioLink || '' }),
                downloadFile({ file_path: convertedAudioLink || '' })
              ])

              return (
                <BotCard>
                  <ConversionPage
                    conversionId={conversionId}
                    originUrl={originUrl}
                    modelLabel={modelLabel}
                    sourceAudioLink={sourceAudioUrl.download_url}
                    convertedAudioLink={convertedAudioUrl.download_url}
                  />
                </BotCard>
              )
            } catch (error) {
              console.error('Error downloading audio files:', error)
            }
          } else {
            return (
              <BotCard>
                <div>conversion is processing, please try later</div>
              </BotCard>
            )
          }

          return (
            <BotCard>
              <div>conversion id: {conversionId}</div>
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

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'tool' ? (
          message.content.map(tool => {
            return tool.toolName === 'listStocks' ? (
              <BotCard>
                {/* TODO: Infer types based on the tool result*/}
                {/* @ts-expect-error */}
                <Stocks props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'showStockPrice' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Stock props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'showStockPurchase' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Purchase props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'getEvents' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Events props={tool.result} />
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
