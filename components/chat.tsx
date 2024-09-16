'use client'
import 'regenerator-runtime/runtime'
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { Message, Session } from '@/lib/types'
import TalkingHeadComponent from '@/components/avatarai/page'
import { useChat } from 'ai/react'
import fetch_and_play_audio from '@/lib/chat/fetch_and_play_audio'
import SpeechRecognition, {
  useSpeechRecognition
} from 'react-speech-recognition'
import classTypes from '@/public/data/classTypes'
import CrazyButtons from './crazy-buttons'
import { useBackground } from '@/lib/hooks/background-context'
import { useClass } from '@/lib/hooks/class-context'
import Backgrounds from '@/public/data/backgrounds'
import { ChatPanel } from './chat-panel'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  session?: Session
  missingKeys: string[]
}

export function Chat({ id }: ChatProps) {
  const [audioBuffer, setAudioBuffer] = useState<Uint8Array | undefined>(
    undefined
  )
  const [textResponse, setTextResponse] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [localClassType, setLocalClassType] = useState('2')
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [isResponding, setIsResponding] = useState(false)

  // https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat
  let {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    append
  } = useChat({
    body: {
      classType: localClassType
    }
  })

  const {
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition,
    listening
  } = useSpeechRecognition()
  const { selectedBackground } = useBackground()
  const { selectedClass } = useClass()

  const lastAiMessageRef = useRef<Message | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null) // Ref for the textarea

  useEffect(() => {
    if (messages.length === 0) {
      append({ role: 'user', content: "Hello, let's start the class!" })
    }
  }, [append, messages])

  useEffect(() => {
    setLocalClassType(selectedClass)
  }, [selectedClass])
  useEffect(() => {
    setInput(transcript)
  }, [transcript])
  useEffect(() => {
    setMessages([])
    setInput('')
  }, [localClassType])
  useEffect(() => {
    console.log('running lsistener')
    if (!browserSupportsSpeechRecognition) {
      console.error('Browser does not support speech recognition.')
      return
    }

    if (!isResponding) {
      // Start listening for speech immediately when the component mounts
      SpeechRecognition.startListening({ continuous: true, language: 'en-US' })
      console.log('Listening for speech...')
    }

    if (isResponding) {
      SpeechRecognition.stopListening() // Clean up on unmount or when editing starts
      console.log('Stopped listening for speech.')
    }

    return () => {
      SpeechRecognition.stopListening() // Clean up on unmount or when editing starts
      console.log('Stopped listening for speech.')
    }
  }, [isResponding, isEditing, browserSupportsSpeechRecognition])

  const get_each_sentence = (phrase: string) => {
    const endofSentenceRegex = /([^\.\?\!]+[\.\?\!])/g
    const sentences = phrase.match(endofSentenceRegex) || [] // Match sentences with punctuation

    const mergedSentences: string[] = []
    let tempSentence = ''
    const min_words = 5
    for (let i = 0; i < sentences.length; i++) {
      const wordCount = sentences[i].split(' ').length
      // Accumulate sentence if it's under the word limit
      if (wordCount < min_words) {
        tempSentence += sentences[i]
        continue
      }

      // Merge with accumulated sentences if needed
      if (tempSentence) {
        mergedSentences.push(tempSentence + ' ' + sentences[i])
        tempSentence = '' // Clear temp after merging
      } else {
        mergedSentences.push(sentences[i]) // Otherwise, push current sentence
      }
    }

    // In case the last tempSentence was not added (if it has fewer than min_words)
    if (tempSentence) {
      mergedSentences.push(tempSentence.trim())
    }

    return mergedSentences
  }

  async function playText({ text }: { text: string }) {
    const audiB = await fetch_and_play_audio({
      text: text
    })
    setTextResponse(text)
    setAudioBuffer(audiB as any)
  }
  useEffect(() => {
    async function getAudioAndPlay() {
      if (messages.length === 0) {
        return
      }
      if (messages[messages.length - 1]?.role === 'assistant') {
        const lastMessage = messages[messages.length - 1]
        const sentences = get_each_sentence(lastMessage.content)
        for (const sentence of sentences) {
          const audiB = await fetch_and_play_audio({
            text: sentence
          })
          setTextResponse(sentence)
          setAudioBuffer(audiB as any)
        }
      }
    }
    getAudioAndPlay()
  }, [isLoading])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent sending another message while waiting for a response
    if (isResponding) return

    // Call handleSubmit with the updated input state
    handleSubmit()

    // Reset the transcript after submission
    resetTranscript()

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    lastAiMessageRef.current = null // Reset for the next AI message
  }

  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight() // Adjust height whenever transcript is updated
    }
  }, [transcript, input])

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto' // Reset the height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px` // Adjust based on scroll height
    }
  }

  const handleTextareaChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setIsEditing(true) // Stop transcription when the user starts typing
    handleInputChange(event) // Allow manual editing of the input
  }
  const ClassTitle = () => (
    <span className="text-2xl font-semibold text-center">
      {
        classTypes[classTypes.findIndex(ct => ct.id === selectedClass)]
          ?.description
      }
    </span>
  )

  return (
    <div className="flex flex-col size-full ">
      <div className="flex items-start justify-start width-full">
        <ClassTitle />
      </div>
      <div className="flex size-full justify-between">
        <div className="relative h-full w-1/2">
          <Image
            src={
              selectedBackground &&
              Backgrounds &&
              Backgrounds.find(bg => bg.id === selectedBackground)
                ? Backgrounds.find(bg => bg.id === selectedBackground)!.src
                : Backgrounds[0].src
            }
            alt="Background"
            layout="fill"
            style={{ objectFit: 'cover', filter: 'blur(2px)' }}
            priority={true}
            className="transition ease-in-out duration-1000"
          />
          <TalkingHeadComponent
            textToSay={textResponse}
            audioToSay={audioBuffer}
            setIsResponding={setIsResponding}
          />
        </div>
        <div className="px-2 max-w-2xl w-1/2">
          {isChatOpen ? (
            <ChatPanel
              setIsChatOpen={setIsChatOpen}
              messages={messages}
              onSubmit={onSubmit}
              selectedClass={selectedClass}
              setInput={setInput}
              input={input}
              handleTextareaChange={handleTextareaChange}
              textareaRef={textareaRef}
              playText={playText}
            />
          ) : (
            <CrazyButtons setIsChatOpen={setIsChatOpen} />
          )}
        </div>
      </div>
    </div>
  )
}
