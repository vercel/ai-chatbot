'use client'

import { UIState } from '@/lib/chat/actions'
import { Session } from '@/lib/types'
import { useState, useEffect } from 'react'
import { IconPlus, IconClose } from './ui/icons'

export interface ChatList {
  messages: UIState
  session?: Session
  isShared: boolean
}

export function ChatList({ messages, session, isShared }: ChatList) {

  const [displayMessages, setDisplayMessages] = useState<UIState>([]);
  const [showFullThread, setShowFullThread] = useState<boolean>(false);

  if (!messages || messages.length === 0) {
    return null;
  }

  const filterMessages = (messages: UIState): UIState => {
    // Filter to get only user messages
    const userMessages = messages.filter((message: any) => message.display.type.name === 'UserMessage');

    // Get the index of the last user message
    const lastUserMessageIndex = userMessages.length > 0 ? messages.indexOf(userMessages[userMessages.length - 1]) : -1;

    // If there are no user messages or the last user message isn't found, return null or handle as needed
    if (lastUserMessageIndex === -1) {
      return messages; // or display some default message if there are no user messages
    }

    return messages.slice(lastUserMessageIndex);
  }


  useEffect(() => {
    if (showFullThread) {
      setDisplayMessages(messages);
    } else {
      const filteredMessages: UIState = filterMessages(messages);
      setDisplayMessages(filteredMessages);
    }
  }, [showFullThread]);

  useEffect(() => {
    // Your effect logic here
    // Slice the messages array from the last user message to the end
    if (showFullThread) {
      setDisplayMessages(messages);
    } else {
      setDisplayMessages(filterMessages(messages));
    }

    return () => {
      // Cleanup logic here
      setDisplayMessages([]);
    };
  }, [messages]);

  return (
    <div className="w-11/12 mr-auto">
      { messages.filter((message: any) => message.display.type.name === 'UserMessage').length > 1 ? (
        <div className='flex items-start p-1 max-w-[200px] bg-sky-100 border shadow-md border-sky-100/[0.30] mb-5 rounded-md'>
          { !showFullThread ? 
          <IconPlus className="flex size-[20px] shrink-0 select-none items-center justify-center rounded-md border border-sky-100 bg-white text-sky-600 shadow-sm" />
          : <IconClose className="flex size-[20px] shrink-0 select-none items-center justify-center rounded-md border border-sky-100 bg-white text-sky-600 shadow-sm" />
          }
          <p onClick={() => setShowFullThread(!showFullThread)} className="ml-5 cursor-pointer text-sm text-sky-600">
            {showFullThread ? 'Hide' : 'Show'} full chat history
          </p>
        </div>
      ) : null}

      {displayMessages.map((message, index) => {
        return (
        <div key={message.id}>
          {message.display}
          {index < messages.length - 1 && <div className="my-4" />}
        </div>
      )})}
    </div>
  )
}
