import classTypes from '@/public/data/classTypes'
import VocabularyList from './vocabulary-list'
import { useEffect, useState } from 'react'
import { Cross2Icon, PaperPlaneIcon, PlusIcon } from '@radix-ui/react-icons'
import Message from './message'
import claraImg from '../public/claraImg.png'
import Image from 'next/image'

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
const AttachButton = () => (
  <button
    disabled
    style={{
      height: '40px',
      width: '40px'
    }}
    className="flex items-center rounded-full px-3 border border-gray-300 mx-1"
  >
    <PlusIcon className="size-4" />
  </button>
)
const SubmitButton = () => (
  <button
    type="submit"
    style={{
      height: '40px',
      width: '40px'
    }}
    className="flex items-center rounded-full px-3 border border-gray-300 mx-1"
  >
    <PaperPlaneIcon className="size-4" />
  </button>
)
const ChatInput = ({
  onSubmit,
  input,
  handleTextareaChange,
  textareaRef
}: {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  input: string
  handleTextareaChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  textareaRef: React.RefObject<HTMLTextAreaElement>
}) => (
  <form
    onSubmit={onSubmit}
    style={{
      display: 'flex',
      // push items to end
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      padding: '8px',
      borderTop: '1px solid #E5E5EA'
    }}
  >
    <AttachButton />
    <textarea
      name="prompt"
      value={input} // Always keep the input updated
      onChange={handleTextareaChange}
      ref={textareaRef} // Attach ref to the textarea
      rows={1}
      className="flex p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring focus:border-blue-300  resize-none"
    />
    <SubmitButton />
  </form>
)
const Chatheader = ({
  setIsChatOpen
}: {
  setIsChatOpen: (value: boolean) => void
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'row',
      borderBottom: '1px solid #E5E5EA',
      padding: '8px'
    }}
  >
    <div
      style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Image
        src={`/images/clara.png`}
        alt="clara headshot"
        width={36}
        height={36}
        className="rounded-full"
      />
      <span
        className="ml-2 text-lg font-semibold
      "
      >
        Clara
      </span>
    </div>
    <button
      onClick={() => setIsChatOpen(false)}
      style={{
        height: '40px',
        width: '40px'
      }}
    >
      <Cross2Icon className="size-4" />
    </button>
  </div>
)
const MessageList = ({ messages }: { messages: any[] }) => (
  <div
    style={{
      flex: '1',
      overflowY: 'auto' // Scrollable
    }}
  >
    {messages.map((message, index) => (
      <Message key={index} message={message} />
    ))}
  </div>
)
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
      className="flex flex-col justify-end width-full rounded-lg shadow-lg bg-white"
      style={{
        maxWidth: '50vw',
        height: '85vh' // Fixed height
      }}
    >
      <Chatheader setIsChatOpen={setIsChatOpen} />
      <MessageList messages={messages} />
      <ChatInput
        onSubmit={onSubmit}
        input={input}
        handleTextareaChange={handleTextareaChange}
        textareaRef={textareaRef}
      />
      <VocabularyList selectedClass={selectedClass} saidWords={saidWords} />
    </div>
  )
}
