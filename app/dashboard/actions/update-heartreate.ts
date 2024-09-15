'use server'

import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/clerk-sdk-node'

export async function updateHeartRate({
  newHeartRate
}: {
  newHeartRate: string
}) {
  const session = await auth()
  const user_id = session.userId
  if (!user_id) {
    throw new Error('YOU ARE NOT LOGGED IN')
  }
  // Update the postgres database???
  await clerkClient.users.updateUser(user_id, {
    publicMetadata: { heartRate: newHeartRate, weight: '1234' }
  })
}
