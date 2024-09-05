import classTypes from '@/public/data/classTypes'
import VocabularyList from './vocabulary-list'
import { useEffect, useState } from 'react'

export interface ChatPanelProps {
  setIsChatOpen: (value: boolean) => void
  messages: any[]
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  selectedClass: string
  input: string
  handleTextareaChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  textareaRef: React.RefObject<HTMLTextAreaElement>
  setInput: (value: string) => void
}

export function ChatPanel({
  setIsChatOpen,
  messages,
  onSubmit,
  selectedClass,
  input,
  handleTextareaChange,
  textareaRef
}: ChatPanelProps) {
  const [saidWords, setSaidWords] = useState<string[]>([])

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
      classTypes[classTypes.findIndex(ct => ct.id === selectedClass)]
        ?.vocabulary
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

  return (
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
      <VocabularyList selectedClass={selectedClass} saidWords={saidWords} />
    </div>
  )
}
