'use client'
import 'regenerator-runtime/runtime'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { use, useEffect, useState } from 'react'
import { useUIState, useAIState } from 'ai/rsc'
import { Message, Session } from '@/lib/types'
import { usePathname, useRouter } from 'next/navigation'
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'
import { toast } from 'sonner'
import TalkingHeadComponent from '../app/avatarai/page'
import { useChat } from 'ai/react'
import fetch_and_play_audio from '@/lib/chat/fetch_and_play_audio'
export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  session?: Session
  missingKeys: string[]
}

export function Chat({ id, className, session, missingKeys }: ChatProps) {
  const router = useRouter()
  const path = usePathname()

  const [aiState] = useAIState()
  const [audioBuffer, setAudioBuffer] = useState<Uint8Array | undefined>(
    undefined
  )
  const [_, setNewChatId] = useLocalStorage('newChatId', id)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const { messages, input, handleInputChange, handleSubmit } = useChat({})
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(stream => {
        setAudioStream(stream)
        // Set MIME type to 'audio/mpeg' or 'audio/webm' depending on what's supported
        const mimeType = 'audio/webm;codecs=opus' // 'audio/mpeg' or 'audio/mp4' can also be tried if supported by the browser
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          console.error(`${mimeType} is not supported in your browser.`)
          return
        }

        const recorder = new MediaRecorder(stream, { mimeType })
        recorder.ondataavailable = event => {
          if (event.data.size > 0) {
            setAudioBlob(event.data)
          }
        }
        recorder.start()
        setTimeout(() => {
          recorder.stop()
        }, 25000)
      })
      .catch(err => {
        console.error('Error accessing microphone:', err)
      })
  }, [audioBlob])

  useEffect(() => {
    if (audioBlob) {
      const formData = new FormData()
      formData.append('audio', audioBlob, `${Date.now().toString()}.webm`) // Append the Blob as a file
      setAudioStream(null)
      fetch('/api/groq', {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          console.log('Transcription result:', data)
        })
        .catch(error => {
          console.error('Error during transcription:', error)
        })
    }
  }, [audioBlob])
  useEffect(() => {
    console.log(audioStream)
  }, [audioStream])
  useEffect(() => {
    if (session?.user) {
    }
  }, [id, path, session?.user, messages])

  useEffect(() => {
    async function fetchData() {
      if (messages[messages.length - 1]?.role === 'assistant') {
        const audiB = await fetch_and_play_audio({
          text: messages[messages.length - 1]?.content
        })
        setAudioBuffer(audiB)
      }
    }
    fetchData()
  }, [messages])

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <TalkingHeadComponent toSay={audioBuffer} />

      <div>
        {messages.map(message => (
          <div key={message.id}>
            {message.role === 'user' ? 'User: ' : 'AI: '}
            {message.content}
          </div>
        ))}

        <form onSubmit={handleSubmit}>
          <input name="prompt" value={input} onChange={handleInputChange} />
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  )
}
