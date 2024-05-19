'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
      const data = await response.json()
      console.log(data)
      if (data.success) {
        if (typeof window !== 'undefined') {
          const randomUsername = `User${Math.floor(Math.random() * 10000)}`
          localStorage.setItem('username', randomUsername)
        }
        router.push(`/user-chat/${roomId}`)
      } else {
        setError(data.error || 'Failed to join room')
        setRoomId('')
        setTimeout(() => {
          setError(null)
        }, 3000)
      }
    } else {
      setError('Room id required')
      setTimeout(() => {
        setError(null)
      }, 3000)
    }
  }

  const createRoom = () => {
    const newRoomId = uuidv4()
    const randomUsername = `User${Math.floor(Math.random() * 10000)}`
    localStorage.setItem('username', randomUsername)
    router.push(`/user-chat/${newRoomId}`)
  }
  return (
    <main className="h-[90vh] py-10">
      <section className="h-full w-[50%] flex flex-col gap-5 mx-auto py-5 px-8 shadow-sm shadow-white rounded-md">
        <div className="flex flex-col gap-3">
          <span className="text-4xl">Join a Chat Room</span>
          <Input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
            onKeyPress={e => {
              if (e.key === 'Enter') joinRoom()
            }}
          />

          <Button className="" onClick={joinRoom}>
            Join
          </Button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
        <span className='text-center'>Or</span>
        <div className="flex flex-col gap-3">
          <span className="text-4xl">Create New Room</span>
          <Button onClick={createRoom}>Create</Button>
        </div>
      </section>
    </main>
  )
}

export default UserChat
