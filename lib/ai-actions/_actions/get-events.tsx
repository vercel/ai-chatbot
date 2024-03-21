import { z } from 'zod'
import { createAIChatbotAction } from '../genarators'
import { BotCard } from '@/components/stocks'
import { nanoid, sleep } from '@/lib/utils'
import { EventsSkeleton } from '@/components/stocks/events-skeleton'
import { Events } from '@/components/stocks/events'

export const getEventsAction = createAIChatbotAction({
  id: 'getEvents',
  metadata: {
    title: 'Get Events'
  }
})
  .describe(
    'List funny imaginary events between user highlighted dates that describe stock activity.'
  )
  .input({
    events: z.array(
      z.object({
        date: z.string().describe('The date of the event, in ISO-8601 format'),
        headline: z.string().describe('The headline of the event'),
        description: z.string().describe('The description of the event')
      })
    )
  })
  .noHandler()
  .render(async function* ({ input, context }) {
    const { events } = input
    const { aiState } = context
    yield (
      <BotCard>
        <EventsSkeleton />
      </BotCard>
    )

    await sleep(1000)

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'function',
          name: 'getEvents',
          content: JSON.stringify(events)
        }
      ]
    })

    return (
      <BotCard>
        <Events props={events} />
      </BotCard>
    )
  })
