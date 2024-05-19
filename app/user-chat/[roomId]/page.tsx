'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

interface Message {
  from: string
  text: string
}

const Room = () => {
  const { roomId } = useParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState<string>('')
  const username =
    typeof window !== 'undefined' ? localStorage.getItem('username') : null
  const router = useRouter()

  useEffect(() => {
    if (!roomId) return

    const fetchMessages = async () => {
      const response = await fetch(`/api/messages?roomId=${roomId}`)
      const data = await response.json()
      console.log('data', data)
      setMessages(data.messages)
    }

    fetchMessages()

    const intervalId = setInterval(fetchMessages, 2000)
    return () => clearInterval(intervalId)
  }, [roomId])

  const sendMessage = async () => {
    if (!input.trim() || !username) return
    await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ roomId, text: input, from: username })
    })
    setInput('')
  }

  const leaveRoom = () => {
    router.push('/user-chat')
  }
  return (
    <main className="h-[90vh] py-10">
      <section className="h-full relative w-[50%] flex flex-col gap-5 mx-auto py-5 px-8 shadow-sm shadow-white rounded-md">
        <div>
          <span className="text-xl">Room Id: {roomId}</span>
          <div className="py-4 h-[60vh] overflow-y-auto">
            {[...messages]?.reverse().map((msg, index) => (
              <div
                key={index}
                className={msg.from === username ? 'text-right' : msg.from}
              >
                {msg.from === username ? 'Me' : msg.from}: {msg.text}
              </div>
            ))}
          </div>
          <div className="flex gap-3 absolute bottom-3 w-full left-0 px-8">
            <Input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') sendMessage()
              }}
            />
            <Button onClick={sendMessage}>Send</Button>
            <Button
              variant={'destructive'}
              onClick={leaveRoom}
            >
              Leave Room
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Room
