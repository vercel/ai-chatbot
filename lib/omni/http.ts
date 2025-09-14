import { NextResponse } from 'next/server';

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
