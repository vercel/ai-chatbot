'use client'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

const UserChat = () => {
  const [roomId, setRoomId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const joinRoom = async () => {
    if (roomId.trim()) {
      console.log('roomId', roomId)
      const response = await fetch(`/api/messages?roomId=${roomId}`)
      if (response.ok) {
        if (typeof window !== 'undefined') {
          const randomUsername = `User${Math.floor(Math.random() * 10000)}`
          localStorage.setItem('username', randomUsername)
        }
        router.push(`/user-chat/${roomId}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to join room')
      }
    }
  }

  const createRoom = () => {
    const newRoomId = uuidv4()
    const randomUsername = `User${Math.floor(Math.random() * 10000)}`
    localStorage.setItem('username', randomUsername)
    router.push(`/user-chat/${newRoomId}`)
  }
  return (
    <div>
      <h1>Join a Chat Room</h1>
      <input
        type="text"
        placeholder="Enter Room ID"
        value={roomId}
        onChange={e => setRoomId(e.target.value)}
        onKeyPress={e => {
          if (e.key === 'Enter') joinRoom()
        }}
      />

      <button onClick={joinRoom}>Join Room</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h2>Or</h2>
      <button onClick={createRoom}>Create New Room</button>
    </div>
  )
}

export default UserChat
