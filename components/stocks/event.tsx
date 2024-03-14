import { format, parseISO } from 'date-fns'

interface Event {
  date: string
  headline: string
  description: string
}

export function Events({ props: events }: { props: Event[] }) {
  return (
    <div className="-mt-2 flex flex-col gap-2">
      {events.map(event => (
        <div
          key={event.date}
          className="max-w-96 flex shrink-0 flex-col rounded-lg bg-zinc-800 p-4 gap-1"
        >
          <div className="text-sm text-zinc-400">
            {format(parseISO(event.date), 'dd LLL, yyyy')}
          </div>
          <div className="text-base font-bold text-zinc-200">
            {event.headline}
          </div>
          <div className="text-zinc-500">
            {event.description.slice(0, 70)}...
          </div>
        </div>
      ))}
    </div>
  )
}
