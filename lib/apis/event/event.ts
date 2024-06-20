import { PartialEventResponse } from '@/lib/models/Event'

import { makeRequest, endpoint } from '../base'

interface FetchEventParams {
  eventId: string
}

export async function fetchEvent({ eventId }: FetchEventParams) {
  return await makeRequest<PartialEventResponse>({
    method: 'GET',
    url: `${endpoint}/event/${eventId}`,
    next: { revalidate: 0 } // No need to cache. The API response keeps changing until all workflows are completed.
  })
}
