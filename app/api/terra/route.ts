import { clerkClient } from '@clerk/clerk-sdk-node'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Your API logic here
  return NextResponse.json({ message: 'Hello from Terra API' })
}
