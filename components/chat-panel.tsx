import classTypes from '@/public/data/classTypes'
import VocabularyList from './vocabulary-list'
import { useEffect, useState } from 'react'
import { Cross2Icon, PaperPlaneIcon, PlusIcon } from '@radix-ui/react-icons'
import Message from './message'
import { Button } from '@/components/ui/button'
import { Textarea } from './ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRef } from 'react'

export interface ChatPanelProps {
  setIsChatOpen: (value: boolean) => void
  messages: any[]
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  selectedClass: string
  input: string
  setMessages: (value: any) => void
  handleTextareaChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  textareaRef: React.RefObject<HTMLTextAreaElement>
  setInput: (value: string) => void
  playText: ({ text }: { text: string }) => void
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


const MessageList = ({ messages, onStartRecording, onStopRecording, isRecording }: {messages:Object[], onStartRecording: Function, onStopRecording: Function, isRecording: boolean}) => (
  <div
    style={{
      flex: '1',
      overflowY: 'auto', // Scrollable
    }}
  >
    {messages.map((message: any, index:number) => (
      <Message
        key={index}
        message={message}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
        isRecording={isRecording}
      />
    ))}
  </div>
);
export function ChatPanel({
  setIsChatOpen,
  messages,
  onSubmit,
  selectedClass,
  input,
  setMessages,
  handleTextareaChange,
  textareaRef,
  playText
}: ChatPanelProps) {
  const [saidWords, setSaidWords] = useState<string[]>([])
  // New state for recording
  const [isRecording, setIsRecording] = useState(false);
  const [expectedText, setExpectedText] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Function to start recording
  const handleStartRecording = async (textToPronounce: string) => {
    setIsRecording(true);
    setExpectedText(textToPronounce);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
        const evaluationResult = await evaluateAudio(audioFile, expectedText);

        // Update messages with evaluation result
        setMessages((messages:any) => [
          ...messages,
          {
            role: 'assistant',
            content: evaluationResult.coloredText,
            id: ""
          },
        ]);
      };

      mediaRecorderRef.current.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsRecording(false);
    }
  };

  // Function to stop recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Function to evaluate audio
  const evaluateAudio = async (file: File, transcription: string) => {
    const apiUrl =
      'https://hjngsvyig3.execute-api.us-west-1.amazonaws.com/production/audioEval';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('transcription', transcription);
    formData.append('language', 'en');

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);

      const realTranscript = data.real_transcript;
      const letterCorrectness = data.is_letter_correct_all_words.trim().split(' ');
      const pronunciationAccuracy = data.pronunciation_accuracy;

      // Generate colored transcript based on the correctness
      const coloredText = realTranscript
        .split('')
        .map((letter: string, index: number) => {
          const isCorrect = letterCorrectness[index] === '1';
          return isCorrect
            ? `<span style="color: green">${letter}</span>`
            : `<span style="color: red">${letter}</span>`;
        })
        .join('');

      return {
        accuracyScore: pronunciationAccuracy,
        coloredText,
      };
    } catch (error) {
      console.error('Error during API request:', error);
      return {
        accuracyScore: 0,
        coloredText: 'Error evaluating pronunciation.',
      };
    }
  };
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
      <MessageList messages={messages} onStartRecording={handleStartRecording} onStopRecording={handleStopRecording} isRecording={isRecording}/>
      <ChatInput
        onSubmit={onSubmit}
        input={input}
        handleTextareaChange={handleTextareaChange}
        textareaRef={textareaRef}
      />
      <VocabularyList
        selectedClass={selectedClass}
        saidWords={saidWords}
        playText={playText}
      />
    </div>
  )
}
