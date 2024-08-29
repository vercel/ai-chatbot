import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function middleware(request: NextRequest) {
  const start = Date.now()
  const requestId = uuidv4()

  // Attach the start time and request ID to the request headers
  request.headers.set('x-start-time', start.toString())
  request.headers.set('x-request-id', requestId)

  console.log(`[${requestId}] New request to`, request.nextUrl.pathname)

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
