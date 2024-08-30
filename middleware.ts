import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { HttpMethod, Route, RouteLogOutput, Timestamp, UUID } from './lib/types'

export async function middleware(request: NextRequest) {
  const start: Timestamp = `${Date.now()}`
  const requestId: UUID = uuidv4()
  const method = request.method as HttpMethod
  const pathname = request.nextUrl.pathname as Route

  // Attach the start time and request ID to the request headers
  request.headers.set('x-start-time', start)
  request.headers.set('x-request-id', requestId)

  const routeLog: RouteLogOutput = `${requestId} | ${start} | ${method} | ${pathname}`
  console.log(routeLog)

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
