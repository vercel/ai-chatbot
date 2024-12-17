'use client'

import * as React from 'react'
import { useState } from 'react'
import Textarea from 'react-textarea-autosize'

import { useActions, useUIState } from 'ai/rsc'

import { BotMessage, UserMessage } from './stocks/message'
import { type AI } from '@/lib/chat/actions'
import { Button } from '@/components/ui/button'
import { IconArrowElbow, IconPlus } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/navigation'

import { useChat, useChatDispatch } from '@/context/chatContext'
import { toast } from 'sonner'

export function PromptForm({
  input,
  setInput
}: {
  input: string
  setInput: (value: string) => void
}) {
  const router = useRouter()
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const { submitUserMessage, describeImage } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()
  const chats = useChat()
  const [showActions, setShowActions] = useState(false)

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }

    if (input === '/') 
      setShowActions(true)
    else
      setShowActions(false)
  }, [input])

  const fileRef = React.useRef<HTMLInputElement>(null)

  return (
    <form
      ref={formRef}
      onSubmit={async (e: any) => {
        e.preventDefault()

        // Blur focus on mobile
        if (window.innerWidth < 600) {
          e.target['message']?.blur()
        }

        const value = input.trim()
        setInput('')
        if (!value) return

        // Optimistically add user message UI
        setMessages(currentMessages => [
          ...currentMessages,
          {
            id: nanoid(),
            display: <UserMessage>{value}</UserMessage>
          }
        ])

        // Check for `/stj` command
        const isSTJCommand = value.startsWith('/stj ');
        if (isSTJCommand) {
          const searchQuery = value.replace('/stj ', '').trim();

          // Enforce 5-word limit
          const wordCount = searchQuery.split(/\s+/).length;
          if (wordCount > 5) {
            toast.error('O comando /stj não pode ter mais de 5 palavras.');
            return;
          }

          try {
            // Call your scrape API to fetch data
            const response = await fetch('/api/stj', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ search: searchQuery }),
            });

            if (!response.ok) {
              throw new Error(`Failed to fetch data for ${searchQuery}`);
            }

            const data = await response.json();

            // Switch context to Pinecone and append it to the conversation
            setMessages((currentMessages) => [
              ...currentMessages,
              {
                id: nanoid(),
                display: <BotMessage content={`Contexto mudado para STJ com resultados para: ${searchQuery}`} />,
              },
            ]);

            // Use the fetched data in your chat state
            const pineconeContext = data.success ? data.data : 'Sem resultados encontrados.';
            await submitUserMessage(`/stj-context [${searchQuery}]`, chats, pineconeContext);
          } catch (error) {
            console.error(error);
            toast.error(`Erro ao utilizar comando /stj: ${error.message}`);
          }

          return;
        }

        // Submit and get response message
        try {
          const responseMessage = await submitUserMessage(value, chats)
          setMessages(currentMessages => [...currentMessages, responseMessage])
        } catch {
          toast.error(
            'Você atingiu o limite de mensagens. Aguarde um momento e tente novamente.'
          );
        }
      }}
    >
      <input
        type="file"
        className="hidden"
        id="file"
        ref={fileRef}
        onChange={async event => {
          if (!event.target.files) {
            toast.error('No file selected')
            return
          }

          const file = event.target.files[0]

          if (file.type.startsWith('video/')) {
            const responseMessage = await describeImage('')
            setMessages(currentMessages => [
              ...currentMessages,
              responseMessage
            ])
          } else {
            const reader = new FileReader()
            reader.readAsDataURL(file)

            reader.onloadend = async () => {
              const base64String = reader.result
              const responseMessage = await describeImage(base64String)
              setMessages(currentMessages => [
                ...currentMessages,
                responseMessage
              ])
            }
          }
        }}
      />
      { showActions &&
        <ul className="list-none m-0 p-0">
          <li className="cursor-pointer p-2 hover:bg-gray-200" onClick={e => setInput('/stj ')}>
            <span className="text-gray-400 text-sm">/stj <strong className='ml-8'>Buscar no STJ </strong></span> 
          </li>
        </ul>
      }
      <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-8 sm:rounded-md sm:border sm:px-12">
        {/* TODO: Implementar file upload */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-4 top-[14px] size-8 rounded-full bg-background p-0 sm:left-4"
          onClick={() => {
            fileRef.current?.click()
          }}
        >
          <IconPlus />
          <span className="sr-only">New Chat</span>
        </Button>
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          placeholder="Enviar mensagem."
          className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          name="message"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <div className="absolute right-0 top-[13px] sm:right-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="submit" size="icon" disabled={input === ''}>
                <IconArrowElbow />
                <span className="sr-only">Send message</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </form>
  )
}
