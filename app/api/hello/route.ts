// We keep this as a test route

import create_response from '@/lib/api/create_response'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const data = { hi: 'Hello World!' }
  return create_response({
    request,
    data,
    status: 200
  })
}

export async function POST(request: NextRequest) {
  const res = await request.json()
  return create_response({
    request,
    data: res,
    status: 200
  })
}
