'use client'

/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */

import { useActions, useUIState } from 'ai/rsc'
import { useEffect } from 'react'

interface Flight {
  id: number
  airlines: string
  departureTime: string
  arrivalTime: string
  price: number
}

interface ListFlightsProps {
  props?: {
    arrival: string
    departure: string
    flights: Flight[]
  }
}

export const ListFlights = ({
  props = {
    arrival: 'SFO',
    departure: 'JFK',
    flights: [
      {
        id: 1,
        airlines: 'Cathay Pacific',
        departureTime: '11:00',
        arrivalTime: '14:00',
        price: 200
      },
      {
        id: 2,
        airlines: 'Lufthansa',
        departureTime: '15:00',
        arrivalTime: '18:00',
        price: 250
      },
      {
        id: 3,
        airlines: 'Cathay Pacific',
        departureTime: '19:00',
        arrivalTime: '22:00',
        price: 300
      }
    ]
  }
}: ListFlightsProps) => {
  const { arrival, departure, flights } = props
  const { submitUserMessage } = useActions()
  const [_, setMessages] = useUIState()

  return (
    <div
      className={`flex w-full flex-col gap-2 rounded-lg border bg-white p-4 font-medium text-zinc-900`}
    >
      <div className="flex flex-row justify-between border-b pb-2">
        <div className="flex flex-row gap-4">
          <div>
            <div className="text-xs text-zinc-500">DEPARTURE</div>
            <div className="text-lg">{departure}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">ARRIVAL</div>
            <div className="text-lg">{arrival}</div>
          </div>
        </div>
        <div className="flex flex-row gap-4">
          <div>
            <div className="text-right text-xs text-zinc-500">DATE</div>
            <div className="text">24th Mar</div>
          </div>
        </div>
      </div>

      <div>
        {flights &&
          flights.map((flight, index) => (
            <div
              key={flight.id}
              className="flex cursor-pointer flex-row justify-between rounded-lg p-2 hover:bg-zinc-100"
              onClick={async () => {
                const response = await submitUserMessage(
                  `The user has selected flight ${flight.airlines}`,
                  []
                )
                setMessages((currentMessages: any[]) => [
                  ...currentMessages,
                  response
                ])
              }}
            >
              <div className="flex flex-row items-center gap-2 md:w-60">
                <div className="size-8 rounded-md border bg-zinc-100 p-1 md:size-12 md:p-2">
                  <img
                    src={
                      index === 0
                        ? 'https://www.gstatic.com/flights/airline_logos/70px/LA.png'
                        : index === 1
                        ? 'https://www.gstatic.com/flights/airline_logos/70px/LF.png'
                        : 'https://www.gstatic.com/flights/airline_logos/70px/KA.png'
                    }
                  />
                </div>
                <div className="flex-col text-sm md:text-base">
                  <div>
                    {flight.departureTime} - {flight.arrivalTime}
                  </div>
                  <div className="text-sm text-zinc-500 md:text-base">
                    {flight.airlines}
                  </div>
                </div>
              </div>
              <div className="hidden flex-col md:flex">
                <div>5hr 46min</div>
                <div className="text-sm text-zinc-500 md:text-base">
                  JFK-SFO
                </div>
              </div>

              <div>
                <div className="text-right text-sm text-emerald-700 md:text-base">
                  ${flight.price}
                </div>
                <div className="text-sm text-zinc-500 md:text-base">
                  One Way
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
