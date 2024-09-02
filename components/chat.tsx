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
  const [textResponse, setTextResponse] = useState('')
  let { messages, input, setInput, handleInputChange, handleSubmit } = useChat(
    {}
  )
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
        }, 2000) // Record for 2 seconds, send it to whisper
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
          /*  console.log('Transcription result:', data)
          console.log('Transcription:', data.transcription.text) */
          setInput(input + ' ' + data.transcription.text)
        })
        .catch(error => {
          console.error('Error during transcription:', error)
        })
    }
  }, [audioBlob])

  useEffect(() => {
    if (session?.user) {
    }
  }, [id, path, session?.user, messages])

  useEffect(() => {
    async function getAudioAndPlay() {
      if (messages.length === 0) {
        return
      }
      console.log('Messages:', messages[messages.length - 1]?.role)
      console.log('Messages:', messages[messages.length - 1].content.length)
      if (
        messages[messages.length - 1]?.role === 'assistant' &&
        (messages[messages.length - 1].content.length == 100 ||
          messages[messages.length - 1].content.length == 101 ||
          messages[messages.length - 1].content.length == 102 ||
          messages[messages.length - 1].content.length == 103 ||
          messages[messages.length - 1].content.length == 104 ||
          messages[messages.length - 1].content.length == 105 ||
          messages[messages.length - 1].content.length == 106 ||
          messages[messages.length - 1].content.length == 107 ||
          messages[messages.length - 1].content.length == 108 ||
          messages[messages.length - 1].content.length == 109)
      ) {
        console.log(
          'Fetching audio for:',
          messages[messages.length - 1]?.content
        )
        setTextResponse(messages[messages.length - 1]?.content)
        const audiB = await fetch_and_play_audio({
          text: messages[messages.length - 1]?.content
        })
        setAudioBuffer(audiB)
        console.log('Audio buffer:', audiB)
      }
    }
    getAudioAndPlay()
  }, [messages])

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <TalkingHeadComponent textToSay={textResponse} audioToSay={audioBuffer} />

      <div style={{ width: '30%', height: '100vh', overflowY: 'scroll' }}>
        {messages.map(message => (
          <div key={message.id}>
            {message.role === 'user' ? 'User: ' : 'AI: '}
            {message.content}
          </div>
        ))}

        <form onSubmit={handleSubmit}>
          <textarea name="prompt" value={input} onChange={handleInputChange} />
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  )
}
