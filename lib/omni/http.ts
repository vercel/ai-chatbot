import { NextResponse } from 'next/server';
import { z } from 'zod';

export const MessageCanonicalSchema = z.object({
  direction: z.enum(['in', 'out']),
  channel: z.string().min(1),
  to: z.string().min(1),
  from: z.string().min(1),
  content: z.string().min(1),
});
export type MessageCanonical = z.infer<typeof MessageCanonicalSchema>;

export interface OkResponse<T> {
  ok: true;
  trace_id: string;
  data: T;
}

export interface ErrorResponse {
  ok: false;
  code: string;
  message: string;
  trace_id: string;
}

export function ok<T>(data: T, trace_id: string) {
  return NextResponse.json<OkResponse<T>>({ ok: true, trace_id, data }, { status: 200 });
}

export function error(code: string, message: string, trace_id: string, status = 400) {
  return NextResponse.json<ErrorResponse>({ ok: false, code, message, trace_id }, { status });
}
