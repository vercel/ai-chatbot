'use client'

/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import { useActions, useUIState } from 'ai/rsc'
import { ArrowDownRight, ArrowUpRight } from '@/components/ui/icons'

export interface StatusProps {
  summary: {
    departingCity: string
    departingAirport: string
    departingAirportCode: string
    departingTime: string
    arrivalCity: string
    arrivalAirport: string
    arrivalAirportCode: string
    arrivalTime: string
    flightCode: string
    date: string
  }
}

export const suggestions = [
  'Change my seat',
  'Change my flight',
  'Show boarding pass'
]

export const Status = ({
  summary = {
    departingCity: 'Miami',
    departingAirport: 'Miami Intl',
    departingAirportCode: 'MIA',
    departingTime: '11:45 PM',
    arrivalCity: 'San Francisco',
    arrivalAirport: 'San Francisco Intl',
    arrivalAirportCode: 'SFO',
    arrivalTime: '4:20 PM',
    flightCode: 'XY 2421',
    date: 'Mon, 16 Sep'
  }
}: StatusProps) => {
  const {
    departingCity,
    departingAirport,
    departingAirportCode,
    departingTime,
    arrivalCity,
    arrivalAirport,
    arrivalAirportCode,
    arrivalTime,
    flightCode,
    date
  } = summary
  const { submitUserMessage } = useActions()
  const [_, setMessages] = useUIState()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 font-medium dark:bg-zinc-950">
        <div className="flex flex-row items-center gap-4">
          <div className="size-12 rounded-md border bg-zinc-100 p-2">
            <img src="https://www.gstatic.com/flights/airline_logos/70px/LA.png" />
          </div>
          <div>
            <div className="text-sm text-zinc-500">
              {date} · {flightCode}
            </div>
            <div>
              {departingCity} to {arrivalCity}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex w-full flex-row justify-between">
            <div>
              <div className="flex flex-row items-center gap-2 text-2xl">
                {departingAirportCode}
                <div className="rounded-full bg-zinc-200 p-1 text-zinc-500">
                  <ArrowUpRight />
                </div>
              </div>
              <div>{departingAirport}</div>
              <div className="text-sm text-zinc-500">Terminal N · GATE D43</div>
            </div>
            <div>
              <div className="text-2xl text-red-600">{departingTime}</div>
              <div className="text-red-600">2h 15m late</div>
              <div className="text-sm text-zinc-500">in 6h 50m</div>
            </div>
          </div>

          <div className="p-2 text-sm text-zinc-500">
            Total 6h 2m · 2,582mi · Overnight
          </div>

          <div className="flex w-full flex-row justify-between">
            <div>
              <div className="flex flex-row items-center gap-2 text-2xl">
                {arrivalAirportCode}
                <div className="rounded-full bg-zinc-200 p-1 text-zinc-500">
                  <ArrowDownRight />
                </div>
              </div>
              <div>{arrivalAirport}</div>
              <div className="text-sm">Terminal 2 · GATE 59A</div>
              <div className="text-sm text-zinc-500">Baggage Belt 1</div>
            </div>
            <div className="flex flex-col">
              <div className="text-2xl text-red-600">{arrivalTime}</div>
              <div className="text-red-600">2h 15m late</div>
              <div className="text-sm text-zinc-500">in 12h 52m</div>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="flex flex-row flex-wrap gap-2">
        {suggestions.map(suggestion => (
          <div
            key={suggestion}
            className="flex flex-row items-center gap-2 px-3 py-2 text-sm bg-white border rounded-lg cursor-pointer shrink-0 hover:bg-zinc-100"
            onClick={async () => {
              const response = await submitUserMessage(suggestion)
              setMessages((currentMessages: any[]) => [
                ...currentMessages,
                response
              ])
            }}
          >
            <SparklesIcon />
            {suggestion}
          </div>
        ))}
      </div> */}
    </div>
  )
}
