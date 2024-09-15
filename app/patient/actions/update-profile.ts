'use server'

import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/clerk-sdk-node'

export async function updateProfile({
  gender,
  birthday,
  weight,
  height
}: {
  gender: string
  birthday: string
  weight: string
  height: string
}) {
  const session = await auth()
  const user_id = session.userId
  if (!user_id) {
    throw Error('YOU ARE NOT LOGGED IN')
  }
  // Update the postgres database???
  await clerkClient.users.updateUser(user_id, {
    publicMetadata: { gender, birthday, weight, height }
  })
}
