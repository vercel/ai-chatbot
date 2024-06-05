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

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage,
  Stock,
  Purchase
} from '@/components/stocks'

import {
  PlayerCard
} from '@/components/sports/player-card'

import { CheckMyWork } from '@/components/sports/check-my-work'

import { z } from 'zod'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { UserMessage } from '@/components/stocks/message'
import { Chat, Message } from '@/lib/types'
import { auth } from '@/auth'

async function confirmPurchase(symbol: string, price: number, amount: number) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  const purchasing = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Purchasing {amount} ${symbol}...
      </p>
    </div>
  )

  const systemMessage = createStreamableUI(null)

  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000)

    purchasing.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Purchasing {amount} ${symbol}... working on it...
        </p>
      </div>
    )

    await sleep(1000)

    purchasing.done(
      <div>
        <p className="mb-2">
          You have successfully purchased {amount} ${symbol}. Total cost:{' '}
          {formatNumber(amount * price)}
        </p>
      </div>
    )

    systemMessage.done(
      <SystemMessage>
        You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
        {formatNumber(amount * price)}.
      </SystemMessage>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'system',
          content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${
            amount * price
          }]`
        }
      ]
    })
  })

  return {
    purchasingUI: purchasing.value,
    newMessage: {
      id: nanoid(),
      display: systemMessage.value
    }
  }
}

export function SpinnerMessage({ prompt }: { prompt: string}) {
  return <>
    <div className="flex items-center">
    <div className="">
    { spinner }
    </div>
    <p className="text-zinc-500 font-md ml-3">
      {
        prompt === "" ? "Querying the database..." : `Querying the database for "${prompt}"...`
      }
    </p>
    </div>
  </>
}

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
    model: openai('gpt-4o'),
    initial: <SpinnerMessage prompt="" />,
    system: `\
    You are an NFL stats bot. You have access to a database of NFL player stats. 
    
    You can answer general questions about NFL players, but when asked for specific stat questions, you have a function :queryDatabase: at your disposal that can
    query the database for a specific stat. You can also outsource complex queries and computations to the function, for example, year over year changes in EPA.
    
    This function takes in the following arguments:
    
    1. "prompt" parameter, which is the natural language prompt given by the user, rephrased to be more specific and incorporate the context of the conversation.
    2. "players" array, containing objects with keys player_name mentioned by the user, and also player_position if you know it from your knowledge base. 
      
    Only if no player is mentioned, leave the array empty. You must pass player names and positions even on follow up prompts.

    * Valid player positions are QB, RB, WR, TE, K, P. If a defensive player is mentioned, don't pass in a position.
    
    You should take care of handling common player pseudonyms and nicknames. For example, if a user asks "What was Lamar's CPOE when targeting OBJ in 2023?", 
    you should pass the full player name in the prompt and the players parameter as [
      {
        player_name: "Lamar Jackson",
        player_position: "QB"
      },
      {
        player_name: "Odell Beckham Jr.",
        player_position: "WR"
      }
    ]

    3. "teams" array, containing the team names mentioned by the user, if any. If no teams are mentioned, pass an empty array.
        
    Your job is to manage the context of the conversation and provide the function with contextualized prompt. 
    
    If the context of the conversation was about quarterbacks, when prompted about Josh Allen, you should pass Josh Allen and QB in the players parameter.

    The function takes in a natural language prompt, and returns the results of 
    the query, which you then relay back to the user.`,
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
      queryDatabase: {
        description: "Query the nflfastR database for a specific stat with a natural language prompt.",
        parameters: z.object({
          prompt: z.string(),
          players: z.array(z.object({
            player_name: z.string(),
            player_position: z.string().optional()
          })).optional(),
          teams: z.array(z.string()).optional()
        }),
        generate: async function* ({prompt, players=[], teams=[]}) {
          yield (
            <SpinnerMessage prompt={prompt} />
          )

          const toolCallId = nanoid()
          const result = await fetch('https://huddlechat-server-wkztg3dj2q-uc.a.run.app/api/query-database', {
            method: 'POST',
            body: JSON.stringify({
              prompt,
              players,
              teams
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          })

          // error handling
          if (!result.ok) {
            return <BotMessage content="There was an error querying the database." />
          }

          const data = await result.json()
          
          const queryResult = data.query_results;
          const querySummary = data.query_summary;
          const queryAnswer = data.query_answer;
          const sqlQuery = data.sql_query;
          const columnsReferenced = data.columns;
          const nerResults = data.ner_results;

          console.log('nerResults', nerResults)

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
                    toolName: 'queryDatabase',
                    toolCallId,
                    args: { prompt }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'queryDatabase',
                    toolCallId,
                    result: {
                      userPrompt: prompt,
                      queryResult,
                      queryAnswer,
                      querySummary,
                      nerResults
                    }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'assistant',
                content: querySummary
              }
            ]
          })

          return <>
              <div className="flex flex-col mb-5">
                <div className="flex mb-3">
                { nerResults.identified_players.map((player: any) => {
                  return (
                    <PlayerCard playerInfo={player.player_info} />
                  )
                  })
                }
                </div>
                <div className="bg-sky-500 mb-3 flex flex-col">
                    <p className="text-xl text-sky-300 font-semibold flex flex-row items-center">
                    <span className="bg-background flex size-[25px] shrink-0 select-none items-center justify-center rounded-md border border-muted shadow-sm mr-3">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.69667 0.0403541C8.90859 0.131038 9.03106 0.354857 8.99316 0.582235L8.0902 6.00001H12.5C12.6893 6.00001 12.8625 6.10701 12.9472 6.27641C13.0319 6.4458 13.0136 6.6485 12.8999 6.80001L6.89997 14.8C6.76167 14.9844 6.51521 15.0503 6.30328 14.9597C6.09135 14.869 5.96888 14.6452 6.00678 14.4178L6.90974 9H2.49999C2.31061 9 2.13748 8.893 2.05278 8.72361C1.96809 8.55422 1.98636 8.35151 2.09999 8.2L8.09997 0.200038C8.23828 0.0156255 8.48474 -0.0503301 8.69667 0.0403541ZM3.49999 8.00001H7.49997C7.64695 8.00001 7.78648 8.06467 7.88148 8.17682C7.97648 8.28896 8.01733 8.43723 7.99317 8.5822L7.33027 12.5596L11.5 7.00001H7.49997C7.353 7.00001 7.21347 6.93534 7.11846 6.8232C7.02346 6.71105 6.98261 6.56279 7.00678 6.41781L7.66968 2.44042L3.49999 8.00001Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
                    </span>
                    <span className="ml-2">Answer</span>
                    </p>
                    <p className="mb-3 mt-1">{queryAnswer}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-xl text-sky-300 font-semibold flex flex-row items-center">
                  <span className="bg-background flex size-[25px] shrink-0 select-none items-center justify-center rounded-md border border-muted shadow-sm mr-3">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.42503 3.44136C10.0561 3.23654 10.7837 3.2402 11.3792 3.54623C12.7532 4.25224 13.3477 6.07191 12.7946 8C12.5465 8.8649 12.1102 9.70472 11.1861 10.5524C10.262 11.4 8.98034 11.9 8.38571 11.9C8.17269 11.9 8 11.7321 8 11.525C8 11.3179 8.17644 11.15 8.38571 11.15C9.06497 11.15 9.67189 10.7804 10.3906 10.236C10.9406 9.8193 11.3701 9.28633 11.608 8.82191C12.0628 7.93367 12.0782 6.68174 11.3433 6.34901C10.9904 6.73455 10.5295 6.95946 9.97725 6.95946C8.7773 6.95946 8.0701 5.99412 8.10051 5.12009C8.12957 4.28474 8.66032 3.68954 9.42503 3.44136ZM3.42503 3.44136C4.05614 3.23654 4.78366 3.2402 5.37923 3.54623C6.7532 4.25224 7.34766 6.07191 6.79462 8C6.54654 8.8649 6.11019 9.70472 5.1861 10.5524C4.26201 11.4 2.98034 11.9 2.38571 11.9C2.17269 11.9 2 11.7321 2 11.525C2 11.3179 2.17644 11.15 2.38571 11.15C3.06497 11.15 3.67189 10.7804 4.39058 10.236C4.94065 9.8193 5.37014 9.28633 5.60797 8.82191C6.06282 7.93367 6.07821 6.68174 5.3433 6.34901C4.99037 6.73455 4.52948 6.95946 3.97725 6.95946C2.7773 6.95946 2.0701 5.99412 2.10051 5.12009C2.12957 4.28474 2.66032 3.68954 3.42503 3.44136Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
                  </span>
                  <span className="ml-2">Query Summary</span>  
                  </p>
                  <p className="mt-1">{querySummary}</p>
                </div>
              </div>
            <CheckMyWork 
              sqlQuery={sqlQuery}
              columnsReferenced={columnsReferenced}
              queryResult={queryResult}
              queryAnswer={queryAnswer}
              nerResults={nerResults}/>
          </>

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
    submitUserMessage,
    confirmPurchase
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
            return tool.toolName === 'queryDatabase' ? (
              <BotCard>
                {/* TODO: Infer types based on the tool result*/}
                {/* @ts-expect-error */}
                <p>{tool.result}</p>
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
