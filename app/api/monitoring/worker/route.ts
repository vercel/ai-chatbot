import { NextResponse } from 'next/server';
import { createClient } from 'redis';

export async function GET() {
  const client = createClient({ url: process.env.REDIS_URL });
  try {
    await client.connect();
    // @ts-ignore
    const data = await (client as any).hGetAll('omni.worker.inbound');
    await client.quit();
    const ts = Number(data?.ts || 0);
    const alive = ts && Date.now() - ts < 15000;
    return NextResponse.json({ ok: true, status: alive ? 'up' : 'stale', last: ts });
  } catch (err) {
    try { await client.quit(); } catch {}
    return NextResponse.json({ ok: false, error: 'redis_unavailable' }, { status: 503 });
  }
}

