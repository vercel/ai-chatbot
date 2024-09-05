'use client'
import 'regenerator-runtime/runtime'
import { useEffect, useState, useRef, use } from 'react'
import { Message, Session } from '@/lib/types'
import TalkingHeadComponent from '@/components/avatarai/page'
import { useChat } from 'ai/react'
import fetch_and_play_audio from '@/lib/chat/fetch_and_play_audio'
import SpeechRecognition, {
  useSpeechRecognition
} from 'react-speech-recognition'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  session?: Session
  missingKeys: string[]
}
const backgrounds = [
  {
    name: 'Restaurant',
    src: '/bg0.jpg'
  },
  {
    name: 'White',
    src: '/bg1.jpg'
  },
  {
    name: 'Street',
    src: '/bg2.jpg'
  },
  {
    name: 'House',
    src: '/bg3.jpg'
  },
  {
    name: 'Office',
    src: '/bg4.jpg'
  }
]
const classTypes = [
  {
    name: 'Identify important people and places in a hospital',
    vocabulary: [
      'medical',
      'doctor (Dr.)',
      'nurse',
      'surgeon',
      'operating room (OR)',
      'emergency department (ED)'
    ],
    description: 'Lesson #1: Identify important people and places in a hospital'
  },
  {
    name: 'Describe safety procedures',
    vocabulary: [
      'gloves',
      'washing hands',
      'mask',
      'gown',
      'isolation',
      'to disinfect'
    ],
    description: 'Lesson #2: Describe safety procedures'
  },
  {
    name: 'Communicate a patient’s vital signs with the medical team',
    vocabulary: [
      'weight',
      'temperature',
      'pulse',
      'blood pressure',
      'vital signs',
      'to measure'
    ],
    description:
      'Lesson #3: Communicate a patient’s vital signs with the medical team'
  },
  {
    name: 'Ask about a patient’s medical history',
    vocabulary: [
      'medical history',
      'illness',
      'surgery',
      'habits',
      'allergy',
      'medication'
    ],
    description: 'Lesson #4: Ask about a patient’s medical history'
  },
  {
    name: 'Talk to a patient after an accident',
    vocabulary: ['hurt', 'pain', 'bone', 'fracture', 'sprain', 'treatment'],
    description: 'Lesson #5: Talk to a patient after an accident'
  }
]
export function Chat({ id }: ChatProps) {
  const [audioBuffer, setAudioBuffer] = useState<Uint8Array | undefined>(
    undefined
  )
  const [textResponse, setTextResponse] = useState('')
  const [isEditing, setIsEditing] = useState(false) // Track whether the user is editing
  const [classType, setClassType] = useState<string>('free')
  const [isChatOpen, setIsChatOpen] = useState(true) // State to manage chat visibility
  // API: https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat
  let {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading
  } = useChat({
    body: {
      classType
    }
  })
  const lastAiMessageRef = useRef<Message | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null) // Ref for the textarea
  const [isResponding, setIsResponding] = useState(false) // Track if we are waiting for a response
  const [selectedBackground, setSelectedBackground] = useState(
    backgrounds[0].src
  )
  const [saidWords, setSaidWords] = useState<string[]>([])
  const handleBackgroundChange = (event: any) => {
    const selectedName = event.target.value
    const selected = backgrounds.find(bg => bg.name === selectedName)
    setSelectedBackground(selected!.src)
  }
  const handleClassTypeChange = (event: any) => {
    const selectedName = event.target.value
    setClassType(selectedName)
  }
  const {
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition,
    listening
  } = useSpeechRecognition()

  useEffect(() => {
    setInput(transcript)
  }, [transcript])
  useEffect(() => {
    // check if the user has said any of the words in the vocabulary
    // in the messages and add them to the list of said words
    // for all messages, only checking the user messages
    const userMessages = messages.filter(m => m.role === 'user')
    // Concatenate all user messages into a single string
    const userText = userMessages
      .map(m => m.content)
      .join(' ')
      .toLowerCase()

    // Define your vocabulary (which may include composite words/phrases)
    const vocabulary =
      classTypes[classTypes.findIndex(ct => ct.name === classType)]?.vocabulary
    if (!vocabulary) {
      return
    }
    // Filter vocabulary to find terms that are included in the user's text
    const newWords = vocabulary?.filter(
      term =>
        userText.includes(term.toLowerCase()) &&
        !saidWords.includes(term.toLowerCase())
    )

    // Update the saidWords state with any new terms found
    setSaidWords([...saidWords, ...newWords])
  }, [messages])

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
    return sentences
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
  }, [transcript])

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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 'calc(100vh - 65px)'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            display: 'flex'
          }}
        >
          <div>
            <label htmlFor="background-select">Background: </label>
            <select id="background-select" onChange={handleBackgroundChange}>
              {backgrounds.map(bg => (
                <option key={bg.name} value={bg.name}>
                  {bg.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="background-select">Class: </label>
            <select id="background-select" onChange={handleClassTypeChange}>
              {classTypes.map(ct => (
                <option key={ct.name} value={ct.name}>
                  {ct.description}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          height: 'calc(98vh - 65px)',
          width: '100%'
        }}
      >
        <div
          style={{
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            width: '100%',
            height: 'calc(98vh - 65px)',
            backgroundImage: `url(${selectedBackground})`,
            transition: 'background-image 0.5s ease-in-out'
          }}
        >
          <TalkingHeadComponent
            textToSay={textResponse}
            audioToSay={audioBuffer}
            setIsResponding={setIsResponding}
          />
        </div>
        <div
          style={{
            width: '100%',
            height: 'calc(98vh - 85px)',
            display: 'flex',
            flexDirection: 'column-reverse',
            alignItems: 'space-evenly'
          }}
        >
          {isChatOpen ? (
            <div
              style={{
                width: '100%', // Responsive width based on viewport
                height: '75vh', // Fixed height
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                backgroundColor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end' // Align chat to the bottom
              }}
            >
              {/* Close Button */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}
              >
                <button
                  onClick={() => setIsChatOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '5px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#34B7F1'
                  }}
                >
                  ✖
                </button>
              </div>

              <div
                style={{
                  flex: '1',
                  overflowY: 'auto' // Scrollable
                }}
              >
                {messages.map((message, index) => (
                  <div
                    key={index}
                    style={{
                      textAlign: message.role === 'user' ? 'right' : 'left',
                      marginBottom: '8px',
                      padding: '2px'
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '8px 12px',
                        borderRadius: '20px',
                        backgroundColor:
                          message.role === 'user' ? '#DCF8C6' : '#E5E5EA',
                        color: '#000',
                        maxWidth: '75%',
                        wordWrap: 'break-word'
                      }}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={onSubmit}
                style={{
                  display: 'flex',
                  padding: '8px',
                  borderTop: '1px solid #E5E5EA'
                }}
              >
                <textarea
                  name="prompt"
                  value={input} // Always keep the input updated
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
                    color: 'black'
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
                    cursor: 'pointer'
                  }}
                >
                  Send
                </button>
              </form>
              <div>
                {classTypes[classTypes.findIndex(ct => ct.name === classType)]
                  ?.vocabulary?.length > 0 ? (
                  <div
                    style={{
                      display: 'flex', // Flexbox layout for horizontal alignment
                      padding: 0, // Remove default padding
                      margin: 0, // Remove default margin
                      gap: '20px' // Space between items (use marginRight if not using gap)
                    }}
                  >
                    {classTypes[
                      classTypes.findIndex(ct => ct.name === classType)
                    ].vocabulary.map((word, index) => (
                      <span
                        key={index}
                        // style so that the word is barely readable if not said
                        // and animate when the user said it
                        style={{
                          padding: '8px',
                          borderRadius: '20px',
                          backgroundColor: saidWords.includes(word)
                            ? '#DCF8C6'
                            : '#E5E5EA',
                          color: saidWords.includes(word) ? '#000' : '#fff',
                          transition: 'background-color 0.5s ease-in-out',
                          cursor: 'pointer'
                        }}
                      >
                        {word}
                      </span> // Using <div> for each word
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{
                  position: 'fixed',
                  right: '2vh',
                  bottom: '55vh',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#34B7F1',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  zIndex: 1000,
                  fontSize: '24px'
                }}
                onClick={() => setIsChatOpen(true)}
              >
                📅
              </div>
              <div
                style={{
                  position: 'fixed',
                  right: '2vh',
                  bottom: '45vh',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#34B7F1',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  zIndex: 1000,
                  fontSize: '24px'
                }}
                onClick={() => setIsChatOpen(true)}
              >
                🏆
              </div>
              <div
                style={{
                  position: 'fixed',
                  right: '2vh',
                  bottom: '35vh',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#34B7F1',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  zIndex: 1000,
                  fontSize: '24px'
                }}
                onClick={() => setIsChatOpen(true)}
              >
                🎁
              </div>
              <div
                style={{
                  position: 'fixed',
                  right: '2vh',
                  bottom: '25vh',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#34B7F1',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  zIndex: 1000,
                  fontSize: '24px'
                }}
                onClick={() => setIsChatOpen(true)}
              >
                📖
              </div>
              <div
                style={{
                  position: 'fixed',
                  right: '2vh',
                  bottom: '15vh',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#34B7F1',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  zIndex: 1000,
                  fontSize: '24px'
                }}
                onClick={() => setIsChatOpen(true)}
              >
                📞
              </div>
              <div
                style={{
                  position: 'fixed',
                  right: '2vh',
                  bottom: '5vh',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#34B7F1',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  zIndex: 1000,
                  fontSize: '24px'
                }}
                onClick={() => setIsChatOpen(true)}
              >
                💬
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
