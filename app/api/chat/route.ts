import { AIStream, StreamingTextResponse } from 'ai'
import { auth } from '@/auth'
import { getSupabaseClient, nanoid } from '@/lib/utils'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

  const apiUrl = process.env.API_URL;

  export async function POST(req: Request) {
    const json = await req.json()
    const { messages } = json
    const message = (messages[messages.length - 1]).content
    const userId = (await auth())?. user?.id
  
    if (!userId) {
      return new Response('Unauthorized', {
        status: 401
      })
    }
  
    const response = await fetch(`${apiUrl}/chat`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        message: message,
        temperature: '1.2',
        model: 'gpt-3.5-turbo',
      })
    });


    const callback =  {
      onCompletion: async (completion: string) => {
        //save to database
        const supabase = getSupabaseClient()
        const id = json.id ?? nanoid()
        const title = json.messages[0].content.substring(0, 100)
        const createdAt = Date.now()
        const payload = {
          id,
          title,
          user_id: userId,
          messages: [
            ...messages,
            {
              content: completion,
              role: 'assistant',
              created_at: createdAt,
            }
          ]
        }
        const { error } = await supabase
          .from('chats')
          .upsert(payload)
      
        if(error) {
          console.log("error storing chat",error) 
        }
      }
    }
  
    const stream = AIStream(response, undefined, callback);
  
    return new StreamingTextResponse(stream);
}
