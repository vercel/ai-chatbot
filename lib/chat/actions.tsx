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
import { generateText } from 'ai';

import { createEmbeddings,
  getEmbeddingsFromPinecone, 
  getEmbeddingsFromQdrant,
  getEmbeddingsFromWeviate } from './embeddingsProviders'

import {
  spinner,
  BotMessage,
  SystemMessage,
} from '@/components/stocks'

import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { BotCard, SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat, Message } from '@/lib/types'
import { auth } from '@/auth'
import { vectorsIDs } from './utils'
import { rateLimit } from './rateLimit'

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

async function describeImage(imageBase64: string) {
  'use server'

  // await rateLimit()

  const aiState = getMutableAIState()
  const spinnerStream = createStreamableUI(null)
  const messageStream = createStreamableUI(null)
  const uiStream = createStreamableUI()

  uiStream.update(
    <BotCard>
      <SpinnerMessage />
    </BotCard>
  )
  messageStream.update(
    <BotCard>
      <BotMessage content="Analizando a imagem..." />
    </BotCard>
  )
  ;(async () => {
    try {
      let text = ''

      // attachment as video for demo purposes,
      // add your implementation here to support
      // video as input for prompts.
      if (imageBase64 === '') {
        await new Promise(resolve => setTimeout(resolve, 5000))

        text = `I'm sorry, I couldn't find any books in the image.`
      } else {
        // const imageData = imageBase64.split(',')[1]

        const model = openai(process.env.STANDARD_MODEL || 'gpt-4o-mini')
        const prompt = 'Analyze the image and describe it in detail. Answer in Brazilian Portuguese.'
        // const image = {
        //   inlineData: {
        //     data: imageData,
        //     mimeType: 'image/png'
        //   }
        // }

        const result = await generateText({
          model,
          maxTokens: 1024,
          messages: [
            {
              role: 'system',
              content: prompt
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze the image and describe it in detail from a legal perspective.'
                },
                {
                  type: 'image',
                  image: imageBase64
                }
              ]
            }
          ],
        })
        text = result.text
        console.log('describeImage',result.text)
      }

      spinnerStream.done(null)
      // messageStream.done(null)

      uiStream.done(
        <BotCard>
          <BotMessage content={text} />
        </BotCard>
      )

      messageStream.done(
        <BotCard>
          <BotMessage content={text} />
        </BotCard>
      )

      aiState.done({
        ...aiState.get(),
        interactions: [text]
      })
    } catch (e) {
      console.error(e)

      const error = new Error(
        'The AI got rate limited, please try again later.'
      )
      uiStream.error(error)
      spinnerStream.error(error)
      messageStream.error(error)
      aiState.done(null)
    }
  })()

  return {
    id: nanoid(),
    attachments: uiStream.value,
    spinner: spinnerStream.value,
    display: messageStream.value
  }
}

async function submitUserMessage(content: string, chat?: any) {
  'use server'

  // Rate limit
  await rateLimit()

  if (!chat)
    chat = {
      "Name": "standard",
      "Model": "gpt-3.5-turbo",
      "Vector": ["reciPa2dwv431SRrU"],
      "System prompt": null,
    }

  console.log("Chat: ", chat)
  
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

  let CONTEXT = ''

  if (chat["Vector"]) {

      // Gambiarra, remover
      const vectorName = (chat["Vector"][0] ?? vectorsIDs.find(vector => vector.id === chat["Vector"][0])?.name) || 'other'

      // Create input embedding
      // const embeddings = content.split(' ').length > 2 ? await createEmbeddings(content) as number[] : []
      const embeddings = await createEmbeddings(content, vectorName) as number[]

      // Mapping vectors to the correct service
      
      if (vectorName == 'pinecone')
        CONTEXT = await getEmbeddingsFromPinecone(embeddings, chat["Query"]) // CHANGE
      else if (vectorName == 'qdrant')
        CONTEXT = await getEmbeddingsFromQdrant(embeddings, chat["Name"])
      else if (vectorName == 'weviate') 
        CONTEXT = await getEmbeddingsFromWeviate(embeddings)
  }

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  // console.log("Prompt: ", chat["System prompt"])

  // console.log("Content: ", content)

  const result = await streamUI({
    model: openai(chat['Model'] || 'gpt-4o-mini'),
    initial: <SpinnerMessage />,
    temperature: 0,
    system: chat["System prompt"],
    prompt: `[User prompt: ${content}] 

    [CONTEXT: ${CONTEXT}]
    
    [Conversation history: ${aiState.get().messages.map((message: any) => message.content).join(' ').slice(0, 1024)}]
    `,
    // messages: [
    //   ...aiState.get().messages.map((message: any) => ({
    //     role: message.role,
    //     content: message.content,
    //     name: message.name
    //   }))
    // ],
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
    confirmPurchase,
    describeImage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState()

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState as Chat)
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

      const firstMessageContent = messages[0]?.content as string || ''
      const title = firstMessageContent.substring(0, 100) || 'Image description'

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
        message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null
    }))
}


// const standardConfig = {
//   model: 'gpt-4o',
//   system: `You are a jurisprudency analist and you can help users understand legal terms, step by step.
//   You and the user can discuss legal terms and the user can ask you to explain the terms.
//   Use only information from the provided context. Always list the used references and sources from the context including the fiuelds Processo, Relator, Ementa, Acórdão and Link.
//   Based on the context you obtain, craft a well-thought-out response and indicate your sources. NEVER invented numbers or hallucinated. Only use information from the file provided. 
//   If you can't find the answer, say: 'I still don't know the answer, unfortunately.' Use the data format provided to prepare your answer and include at least the following keys in your answer: 
//   "process", "rapporteur", "menu" and "agreement" and "link". Remember that the 'link' of the process is exactly the one that appears in the file, considering a string from the "link" key, 
//   which always starts with the following structure: "https://processo.stj.jus.br/processo /search/?num_registro=...".
//   Answer always in Brazilian Portuguese.`,
  
//   // [CONTEXT: ${context.map((match: any) => match.metadata.document).join()}]

//   // [Conversation history: ${aiState.get().messages.map((message: any) => message.content).join(' ').slice(0, 1024)}]`,
//   maxTokens: 1024,
//   temperature: 0,
//   topP: 1,
//   frequencyPenalty: 0,
//   presencePenalty: 0,
//   stop: '\n'
// }



    // If the user asks you to explain a term, call \`explain_term\` to explain the term.
    // If the user asks you to explain a legal concept, call \`explain_concept\` to explain the concept.
    // If the user asks you to explain a legal case, call \`explain_case\` to explain the case.