import { clerkClient } from '@clerk/clerk-sdk-node'

export async function GET(request: Request) {
  const clerk = clerkClient({ apiKey: process.env.CLERK_API_KEY })
  return new Response('Hello, Terra!')
}
