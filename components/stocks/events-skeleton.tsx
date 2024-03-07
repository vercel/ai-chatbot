const placeholderEvents = [
  {
    date: '2022-10-01',
    headline: 'NVIDIA releases new AI-powered graphics card',
    description:
      'NVIDIA unveils the latest graphics card infused with AI capabilities, revolutionizing gaming and rendering experiences.'
  }
]

export const EventsSkeleton = ({ events = placeholderEvents }) => {
  return (
    <div className="-mt-2 flex flex-col gap-2 py-4">
      {placeholderEvents.map(event => (
        <div
          key={event.date}
          className="max-w-96 flex gap-1 shrink-0 flex-col rounded-lg bg-zinc-800 p-4"
        >
          <div className="w-fit rounded-md bg-zinc-700 text-sm text-transparent">
            {event.date}
          </div>
          <div className="w-fit rounded-md bg-zinc-700 text-transparent">
            {event.headline}
          </div>
          <div className="w-auto rounded-md bg-zinc-700 text-transparent">
            {event.description.slice(0, 70)}...
          </div>
        </div>
      ))}
    </div>
  )
}
