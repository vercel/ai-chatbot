import create_response from '@/lib/api/create_response'
import send_single_mail from '@/lib/sendgrid/send_single_mail'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const res = await request.json()
  const sentEmail = await send_single_mail({
    to: res.to,
    subject: 'hi from sendgrid',
    text: 'hi',
    html: '<h1>hi</h1>'
  })
  return create_response({
    request,
    data: sentEmail,
    status: 200
  })
}
