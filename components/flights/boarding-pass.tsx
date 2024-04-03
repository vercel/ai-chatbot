'use client'

import Barcode from 'react-jsbarcode'

interface BoardingPassProps {
  summary: {
    airline: string
    arrival: string
    departure: string
    departureTime: string
    arrivalTime: string
    price: number
    seat: string
    date: string
    gate: string
  }
}

export const BoardingPass = ({
  summary = {
    airline: 'American Airlines',
    arrival: 'SFO',
    departure: 'NYC',
    departureTime: '10:00 AM',
    arrivalTime: '12:00 PM',
    price: 100,
    seat: '1A',
    date: '2021-12-25',
    gate: '31'
  }
}: BoardingPassProps) => {
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-lg border bg-white p-4 font-medium text-zinc-950`}
    >
      <div className="flex flex-col w-full gap-2">
        <div className="flex flex-col justify-between pb-3 border-b border-zinc-900 md:flex-row md:items-center">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-row items-center text-lg leading-5">
              {summary.airline}
            </div>
          </div>
          <div className="text-lg leading-5">Gate {summary.gate}</div>
        </div>

        <div className="flex flex-col p-2 rounded-lg bg-zinc-100">
          <div className="">Rauch / Guillermo</div>
          <div className="flex flex-col justify-between md:flex-row">
            <div className="">{summary.departure}</div>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="">{summary.date}</div>
            </div>
            <div className="">{summary.arrival}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row">
          <div className="p-2 rounded-lg bg-zinc-100">
            <div className="text-sm">SEAT</div>
            <div className="text-lg">{summary.seat}</div>
          </div>
          <div className="flex-1 p-2 rounded-lg bg-zinc-100">
            <div className="text-sm">CLASS</div>
            <div className="text-lg">BUSINESS</div>
          </div>
          <div className="p-2 rounded-lg bg-zinc-100">
            <div className="text-sm">DEPARTS</div>
            <div className="text-lg">{summary.departureTime}</div>
          </div>
          <div className="p-2 rounded-lg bg-zinc-100">
            <div className="text-sm">ARRIVAL</div>
            <div className="text-lg">{summary.arrivalTime}</div>
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <Barcode
          value="12345RAUCHG"
          options={{ format: 'code128', height: 20, displayValue: false }}
        />
      </div>
    </div>
  )
}
