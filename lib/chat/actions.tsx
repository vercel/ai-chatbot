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
import { Chat, Message, Player, NERResults, DatabaseQueryResult } from '@/lib/types'
import { auth } from '@/auth'

import { ResultsPage } from '@/components/sports/results-page'

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

    * Valid player positions are QB, RB, WR, TE, K, P. If a defensive player is mentioned, pass 'DEF' as the position name, even if you know the actual position.
    
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
            player_position: z.string()
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
          
          const nerResults:NERResults = {
            players: data.ner_results.identified_players.map((player: any) => {
              return {
                playerName: player.player_name,
                playerId: player.player_id,
                team: player.player_info.team,
                position: player.player_info.position,
                height: player.player_info.height,
                weight: player.player_info.weight,
                college: player.player_info.college,
                image: player.player_info.headshot_url,
                dob: player.player_info.birth_date,
                idScore: player.cosine_similarity
              }
            })
          }

          const dbResult: DatabaseQueryResult = {
            userPrompt: prompt,
            nerResults,
            queryAnswer,
            sqlQuery,
            querySummary,
          }

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

          return (<ResultsPage
            nerResults={nerResults}
            queryResult={queryResult}
            queryAnswer={queryAnswer}
            sqlQuery={sqlQuery}
            querySummary={querySummary}
            />)
        }
      }
    }
  })

  return {
    id: nanoid(),
    display: result.value
  }
}

async function submitCachedResponse(content: string) {
  'use server'
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
    submitCachedResponse
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
