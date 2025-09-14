import { NextRequest, NextResponse } from 'next/server';
import { normalizeWhatsApp, type WhatsAppWebhook } from '@/lib/omni/mappers/whatsapp';
import { publishWithRetry } from '@/lib/omni/bus';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const expected = process.env.MCP_TOKEN || 'dev-token';
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== expected) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const body = (await req.json()) as WhatsAppWebhook;
  const env = normalizeWhatsApp(body);
  const id = await publishWithRetry(process.env.OMNI_STREAM_MESSAGES || 'omni.messages', env.message);
  return NextResponse.json({ ok: true, id });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

