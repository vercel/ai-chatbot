'use client'

import { useActions, useUIState } from 'ai/rsc'

interface Hotel {
  id: number
  name: string
  description: string
  price: number
}

interface ListHotelsProps {
  hotels: Hotel[]
}

export const ListHotels = ({
  hotels = [
    {
      id: 1,
      name: 'Beach House',
      description: 'A beautiful beach house',
      price: 42
    },
    {
      id: 2,
      name: 'Mountain House',
      description: 'A cozy mountain house',
      price: 32
    },
    {
      id: 3,
      name: 'City House',
      description: 'A modern city house',
      price: 22
    }
  ]
}: ListHotelsProps) => {
  const { submitUserMessage } = useActions()
  const [_, setMessages] = useUIState()

  return (
    <div className="flex flex-col gap-2 bg-white p-2 font-medium border rounded-lg">
      {hotels.map(hotel => (
        <div
          key={hotel.id}
          className="p-2 flex flex-row justify-between hover:bg-zinc-100 rounded-lg cursor-pointer"
          onClick={async () => {
            const response = await submitUserMessage(
              `I want to book the ${hotel.name}, proceed to checkout.`
            )
            setMessages((currentMessages: any[]) => [
              ...currentMessages,
              response
            ])
          }}
        >
          <div className="flex flex-row gap-4">
            <div className="size-12 bg-zinc-100 border rounded-md"></div>
            <div>
              <div>{hotel.name}</div>
              <div className="text-zinc-500">{hotel.description}</div>
            </div>
          </div>

          <div>
            <div className="text-emerald-700">${hotel.price}</div>
            <div className="text-zinc-500">per night</div>
          </div>
        </div>
      ))}
    </div>
  )
}
