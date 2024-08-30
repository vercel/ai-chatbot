import { NextRequest } from 'next/server'
import { HttpMethod, Route, RouteLogOutput, UUID } from '../types'

function create_response({
  request,
  data,
  status
}: {
  request: NextRequest
  data: any
  status: number
}) {
  const requestId: UUID = request.headers.get('x-request-id') as UUID
  const start = parseInt(request.headers.get('x-start-time') || '0', 10)
  const end = Date.now()
  const duration = end - start

  const routeLog: RouteLogOutput = `${requestId} | ${start} | ${request.method as HttpMethod} | ${request.nextUrl.pathname as Route}`

  console.log(`${routeLog} | ${status} | ${duration}ms`)

  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export default create_response
