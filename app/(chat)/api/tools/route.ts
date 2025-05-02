import { manifest } from '@/lib/ai/tools';
export const maxDuration = 60;

export async function GET() {
  return new Response(JSON.stringify(manifest), { status: 200 });
}
