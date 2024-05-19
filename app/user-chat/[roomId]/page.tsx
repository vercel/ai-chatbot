'use client'

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
    <div>
      <h1>Chat Room: {roomId}</h1>
      <div>
        {messages?.map((msg, index) => (
          <div key={index} className={msg.from === username ? 'me' : msg.from}>
            {msg.from === username ? 'Me' : msg.from}: {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => {
          if (e.key === 'Enter') sendMessage()
        }}
      />
      <button onClick={sendMessage}>Send</button>
      <button onClick={leaveRoom} style={{ marginTop: '10px' }}>
        Leave Room
      </button>
    </div>
  )
}

export default Room
