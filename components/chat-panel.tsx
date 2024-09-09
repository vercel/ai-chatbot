import classTypes from '@/public/data/classTypes'
import VocabularyList from './vocabulary-list'
import { useEffect, useState } from 'react'
import { Cross2Icon, PaperPlaneIcon, PlusIcon } from '@radix-ui/react-icons'
import Message from './message'
import { Button } from '@/components/ui/button'
import { Textarea } from './ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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
  <Button variant="outline" size="icon" disabled>
    <PlusIcon className="dark:text-white" />
  </Button>
)
const SubmitButton = () => (
  <Button variant="outline" size="icon" type="submit">
    <PaperPlaneIcon className="dark:text-white" />
  </Button>
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
    className="flex gap-2 items-end justify-end p-2 border-t border-gray-200 dark:border-gray-700"
  >
    <AttachButton />
    <Textarea
      style={{ resize: 'none' }}
      className="dark:bg-primary dark:text-primary-foreground"
      name="prompt"
      value={input} // Always keep the input updated
      onChange={handleTextareaChange}
      ref={textareaRef} // Attach ref to the T
      rows={1}
      placeholder="Type or dictate a message"
    />
    <SubmitButton />
  </form>
)
const Chatheader = ({
  setIsChatOpen
}: {
  setIsChatOpen: (value: boolean) => void
}) => (
  <div className="flex flex-row justify-between border-b border-gray-200 dark:border-gray-700 p-2">
    <div className="flex items-center">
      <Avatar>
        <AvatarImage src={`/images/clara.png`} alt="Clara" />
        <AvatarFallback>Clara</AvatarFallback>
      </Avatar>
      <span className="ml-2 text-lg font-semibold dark:text-white text-black">
        Clara
      </span>
    </div>
    <Button variant="ghost" onClick={() => setIsChatOpen(false)} size={'icon'}>
      <Cross2Icon className="size-4" />
    </Button>
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

  const normalizeWord = (word: string) => {
    return word
      .replace(/\s*\(.*?\)\s*/g, '')
      .trim()
      .toLowerCase()
  }

  useEffect(() => {
    // Check if the user has said any of the words in the vocabulary
    // in the messages and add them to the list of said words
    // for all messages, only checking the user messages
    const userMessages = messages.filter(m => m.role === 'user')
    // Concatenate all user messages into a single string
    const userText = userMessages
      .map(m => normalizeWord(m.content))
      .join(' ')
      .toLowerCase()

    // Define your vocabulary (which may include composite words/phrases)
    const vocabulary =
      classTypes[classTypes.findIndex(ct => ct.id === selectedClass)]
        ?.vocabulary
    if (!vocabulary) {
      return
    }

    // Normalize the vocabulary terms
    const normalizedVocabulary = vocabulary.map(normalizeWord)

    // Use regex to find whole words or phrases in the user's text
    const newWords = normalizedVocabulary.filter(term => {
      const termRegex = new RegExp(`\\b${term}\\b`, 'i') // Match whole words
      return termRegex.test(userText) && !saidWords.includes(term)
    })

    // Update the saidWords state with any new terms found
    setSaidWords(prevSaidWords => [...prevSaidWords, ...newWords])
  }, [messages, classTypes, selectedClass])

  return (
    <div
      className="flex flex-col justify-end width-full rounded-lg shadow-lg "
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
