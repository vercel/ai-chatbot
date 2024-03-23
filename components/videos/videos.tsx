'use client'

import { useActions, useUIState } from 'ai/rsc'
import type { AI } from '@/lib/chat/actions'
import type { Video } from '@/lib/types'
 

export function Videos({ props: videos }: { props: Video[] }) {
  const [, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()

  return (
    <div className="mb-4 flex flex-col gap-2 overflow-y-scroll pb-4 text-sm sm:flex-row">
      {videos.map(video => (
        <button
          key={video.id}
          className="flex cursor-pointer flex-row gap-2 rounded-lg bg-zinc-800 p-2 text-left hover:bg-zinc-700 sm:w-52"
          onClick={async () => {
            const response = await submitUserMessage(`View ${video.id}`)
            setMessages(currentMessages => [...currentMessages, response])
          }}
        >
          
          <div className="flex flex-col">
            <div className="bold uppercase text-zinc-300">{video.id}</div>
          </div>
        </button>
      ))}
    </div>
  )
}
