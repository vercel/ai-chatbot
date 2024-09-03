'use client'
import 'regenerator-runtime/runtime'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { use, useEffect, useState, useRef } from 'react'
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
  const [audioBuffer, setAudioBuffer] = useState<Uint8Array | undefined>(undefined)
  const [_, setNewChatId] = useLocalStorage('newChatId', id)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [textResponse, setTextResponse] = useState('')

  const [isChatOpen, setIsChatOpen] = useState(false) // State to manage chat visibility
  const [allMessages, setAllMessages] = useState<Message[]>([])
  let { messages, input, setInput, handleInputChange, handleSubmit } = useChat(
    {}
  )
  const lastAiMessageRef = useRef<Message | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null) // Ref for the textarea


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
        }, 10000)
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
          console.log('Transcription:', data.transcription.text) 
          setInput(input + ' ' + data.transcription.text)
        })
        .catch(error => {
          console.error('Error during transcription:', error)
        })
    }
  }, [audioBlob, input, setInput])

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
        console.log('Audio ', audiB)
        setAudioBuffer(audiB as any)
      }
    }
    getAudioAndPlay()
  }, [messages])

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]

      if (lastMessage.role === 'assistant') {
        const contentAsString = transformContentToString(lastMessage.content)

        if (lastAiMessageRef.current) {
          // If an AI message is already being displayed, update it
          setAllMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === lastAiMessageRef.current?.id
                ? { ...msg, content: contentAsString }
                : msg
            )
          )
          lastAiMessageRef.current.content = contentAsString
        } else {
          // If it's a new AI message, add it to the chat
          lastAiMessageRef.current = { ...lastMessage, content: contentAsString } as Message
          setAllMessages(prevMessages => [...prevMessages, lastAiMessageRef.current])
        }
      } else {
        // If the message is from the user or other, add it to the chat
        setAllMessages(prevMessages => [...prevMessages, lastMessage])
      }
    }
  }, [messages])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit()
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }    
    lastAiMessageRef.current = null // Reset for the next AI message
  }

  // Transform content to a renderable string
  function transformContentToString(content: any): string {
    if (typeof content === 'string') {
      return content
    }

    if (Array.isArray(content)) {
      return content.map(part => {
        if (typeof part === 'string') return part
        if (part.text) return part.text // Assuming parts have a text property
        return '' // Fallback in case of an unknown structure
      }).join('')
    }

    // Add more transformations as necessary based on content structure
    return ''
  }

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }


  return (
    <div style={{ display: 'flex', position: 'relative', height: '100vh', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100vh',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            maxWidth: '600px', // Constrain the max width on larger screens
            margin: '0 auto', // Center the avatar horizontally
            padding: '0 10px', // Additional padding for small screens
          }}
        >
          <TalkingHeadComponent textToSay={textResponse} audioToSay={audioBuffer} />
        </div>
      </div>
  
      {!isChatOpen ? (
        <div
          style={{
            position: 'fixed',
            right: '2vh',
            bottom: '5vh',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#34B7F1',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            zIndex: 1000,
          }}
          onClick={() => setIsChatOpen(true)}
        >
          💬
        </div>
      ) : null}
  
      {isChatOpen ? (
        <div
          style={{
            position: 'fixed',
            right: '2vh',
            bottom: '5vh',
            width: 'calc(100% - 4vh)', // Responsive width based on viewport
            maxWidth: '60vh', // Maximum width for larger screens
            height: '70vh', // Fixed height
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            backgroundColor: '#fff',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999, // Ensure chat is above other elements
            marginLeft: 'auto', // Align to the right on smaller screens
            marginRight: 'auto', // Center the chat on smaller screens
            paddingRight: '2vh', // Add padding to the right for smaller screens
          }}
        >
          <div
            style={{
              flex: '1',
              overflowY: 'auto', // Scrollable
              padding: '16px',
            }}
          >
            {allMessages.map((message, index) => (
              <div
                key={index}
                style={{
                  textAlign: message.role === 'user' ? 'right' : 'left',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    backgroundColor: message.role === 'user' ? '#DCF8C6' : '#E5E5EA',
                    color: '#000',
                    maxWidth: '75%',
                    wordWrap: 'break-word',
                  }}
                >
                  {typeof message.content === 'string'
                    ? message.content
                    : transformContentToString(message.content)}
                </div>
              </div>
            ))}
          </div>
  
          <form
            onSubmit={onSubmit}
            style={{
              display: 'flex',
              padding: '8px',
              borderTop: '1px solid #E5E5EA',
            }}
          >
            <textarea
              name="prompt"
              value={input}
              onChange={handleTextareaChange}
              ref={textareaRef} // Attach ref to the textarea
              rows={1}
              style={{
                flex: '1',
                padding: '8px',
                borderRadius: '20px',
                border: 'none',
                resize: 'none', // Disable manual resizing
                overflow: 'hidden', // Hide overflow to make it look clean
                backgroundColor: '#F0F0F0',
              }}
            />
            <button
              type="submit"
              style={{
                marginLeft: '8px',
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: '#34B7F1',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Send
            </button>
          </form>
  
          {/* Close Button */}
          <button
            onClick={() => setIsChatOpen(false)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#34B7F1',
            }}
          >
            ✖
          </button>
        </div>
      ) : null}
    </div>
  )
}  