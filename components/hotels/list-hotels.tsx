/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
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
      name: 'Hôtel Cluny Sorbonne',
      description: 'Traditional quarters in a casual lodging',
      price: 101
    },
    {
      id: 2,
      name: 'Tonic Hotel Du Louvre',
      description: 'Cozy downtown hotel with free Wi-Fi',
      price: 145
    },
    {
      id: 3,
      name: 'Hôtel de France Quartier-Latin',
      description: 'Laid-back lodging with free Wi-Fi',
      price: 112
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
              `I want to book the ${hotel.name}, proceed to checkout by calling checkoutBooking function.`
            )
            setMessages((currentMessages: any[]) => [
              ...currentMessages,
              response
            ])
          }}
        >
          <div className="flex flex-row gap-4">
            <div className="h-12 w-20 bg-zinc-100 border rounded-md">
              <img
                className="object-cover h-full rounded-md"
                src={`/images/${hotel.id}.jpg`}
              />
            </div>
            <div>
              <div>{hotel.name}</div>
              <div className="text-zinc-500">{hotel.description}</div>
            </div>
          </div>

          <div>
            <div className="text-emerald-700 text-right">${hotel.price}</div>
            <div className="text-zinc-500">per night</div>
          </div>
        </div>
      ))}
    </div>
  )
}
