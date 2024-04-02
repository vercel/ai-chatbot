'use client'

import { CardIcon, LockIcon, SparklesIcon } from '@/components/ui/icons'
import { readStreamableValue, useActions, useUIState } from 'ai/rsc'
import { useState } from 'react'

type Status =
  | 'requires_confirmation'
  | 'requires_code'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'in_progress'

interface PurchaseProps {
  status: Status
  summary: {
    airline: string
    departureTime: string
    arrivalTime: string
    price: number
    seat: string
  }
}

export const suggestions = [
  'Show flight status',
  'Show boarding pass for flight'
]

export const PurchaseTickets = ({
  status = 'requires_confirmation',
  summary = {
    airline: 'American Airlines',
    departureTime: '10:00 AM',
    arrivalTime: '12:00 PM',
    price: 100,
    seat: '1A'
  }
}: PurchaseProps) => {
  const [currentStatus, setCurrentStatus] = useState(status)
  const { requestCode, validateCode, submitUserMessage } = useActions()
  const [display, setDisplay] = useState(null)
  const [_, setMessages] = useUIState()

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`flex min-h-56 w-full flex-col gap-4 rounded-lg border bg-white p-4 font-medium md:min-h-52`}
      >
        <div className="flex flex-row justify-between">
          <div className="flex flex-row items-center gap-2 text-violet-950">
            <CardIcon />
            <div className="text-sm">0512</div>
          </div>

          <div className="flex flex-row items-center gap-1 text-purple-950">
            <LockIcon />
            <div className="text-sm">Checkout powered by Stripe</div>
          </div>
        </div>

        {currentStatus === 'requires_confirmation' ? (
          <div className="flex flex-col gap-16 md:gap-12">
            <p className="">
              Thanks for choosing your seats! Confirm your purchase to complete
              your booking.
            </p>
            <div
              className="p-2 text-center rounded-md cursor-pointer bg-purple-950 text-purple-50 hover:bg-purple-900"
              onClick={async () => {
                const { status, display } = await requestCode()
                setCurrentStatus(status)
                setDisplay(display)
              }}
            >
              Pay ${summary.price}
            </div>
          </div>
        ) : currentStatus === 'requires_code' ? (
          <>
            <div>
              Enter the code sent to your phone (***) *** 6137 to complete your
              purchase.
            </div>
            <div className="flex flex-row justify-center p-2 text-center border rounded-md text-purple-950">
              <input
                className="w-16 text-center bg-transparent outline-none tabular-nums"
                type="text"
                maxLength={6}
                placeholder="------"
                autoFocus
              />
            </div>
            <div
              className="p-2 text-center rounded-md cursor-pointer bg-purple-950 text-purple-50 hover:bg-purple-900"
              onClick={async () => {
                const { status, display } = await validateCode()

                for await (const statusFromStream of readStreamableValue(
                  status
                )) {
                  setCurrentStatus(statusFromStream as Status)
                  setDisplay(display)
                }
              }}
            >
              Submit
            </div>
          </>
        ) : currentStatus === 'completed' || currentStatus === 'in_progress' ? (
          display
        ) : currentStatus === 'expired' ? (
          <div className="flex flex-row items-center justify-center gap-3">
            Your Session has expired!
          </div>
        ) : null}
      </div>

      <div
        className={`flex flex-row flex-wrap gap-2 ${
          currentStatus === 'completed' ? 'opacity-100' : 'opacity-0'
        }`}
      >
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
      </div>
    </div>
  )
}
