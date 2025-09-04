import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'API funcionando' });
}

export async function POST() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'POST recebido',
    timestamp: new Date().toISOString()
  });
}