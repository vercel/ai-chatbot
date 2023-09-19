import { kv } from '@vercel/kv'
import { experimental_StreamData, OpenAIStream, StreamingTextResponse } from 'ai'
import { Configuration, OpenAIApi } from 'openai-edge'
import Speech from 'lmnt-node';

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})

const openai = new OpenAIApi(configuration)

export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken } = json
  const userId = (await auth())?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  if (previewToken) {
    configuration.apiKey = previewToken
  }

  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.7,
    stream: true
  })

  const speech = new Speech(process.env.LMNT_API_KEY || '');
  const speechStream = speech.synthesizeStreaming('mara-wilson')
  const extraData = new experimental_StreamData()

  const audioReadTask = async () => {
    let count = 0
    for await (const audioData of speechStream) {
      const audioBytes = Buffer.byteLength(audioData);
      console.log(`Received audio from LMNT: ${count} / ${audioBytes} bytes.`)
      extraData.append({speechAudio: audioData.toString('base64')})
      count += 1
    }

    console.log('Closing LMNT synthesis stream.')
    speechStream.close()
  }

  console.log('Starting LMNT synthesis task.')
  const audioReadTaskPromise = audioReadTask()

  console.log('Creating OpenAI stream.')
  const stream = OpenAIStream(response, {
    onToken(token) {
      console.log('Passing token to LMNT:', token)
      speechStream.appendText(token)
    },

    async onCompletion(completion) {
      console.log('onCompletion: Waiting for LMNT synthesis to complete.')

      const title = json.messages[0].content.substring(0, 100)
      const id = json.id ?? nanoid()
      const createdAt = Date.now()
      const path = `/chat/${id}`
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          ...messages,
          {
            content: completion,
            role: 'assistant'
          }
        ]
      }

      try {
        await kv.hmset(`chat:${id}`, payload)
        await kv.zadd(`user:chat:${userId}`, {
          score: createdAt,
          member: `chat:${id}`
        })

      } catch (error) {
        // The user could hit their request limit (or otherwise experience an error interacting
        // with the key-value store). Catch and log since if we throw the error directly we'll
        // never call `onFinal` and won't send trailing audio data to the client (or finish
        // the response).
        console.warn('Failed to save chat to KV:', error)
      }
    },

    async onFinal(completion) {
      console.log('onFinal: Waiting for LMNT synthesis to complete.')
      speechStream.finish()
      await audioReadTaskPromise

      // Close the StreamData object or the response will never finish.
      console.log('onFinal: LMNT synthesis finished -- closing StreamData.')
      extraData.close()
    },

    // Until the experimental API is stable, we have to explicitly opt in.
    experimental_streamData: true,
  })

  return new StreamingTextResponse(stream, {}, extraData)
}
