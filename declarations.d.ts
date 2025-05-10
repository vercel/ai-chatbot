// This file contains ambient type declarations for modules that don't have their own typings

declare module 'ai' {
  export function tool(config: any): any;
  export function createDataStream(options: any): any;
  export function appendClientMessage(options: any): any[];
  export function appendResponseMessages(options: any): any[];
  export function streamText(options: any): any;
  export function smoothStream(options: any): any;
  export function customProvider(options: any): any;
  export function extractReasoningMiddleware(options: any): any;
  export function wrapLanguageModel(options: any): any;
}

declare module '@ai-sdk/openai' {
  export function openai(model: string): any;
}

declare module '@ai-sdk/xai' {
  export function xai(model: string): any;
}

declare module '@ai-sdk/google' {
  export function google(model: string): any;
}

declare module '@vercel/functions' {
  export function geolocation(request: Request): {
    longitude?: number;
    latitude?: number;
    city?: string;
    country?: string;
  };
}

declare module 'resumable-stream' {
  export interface ResumableStreamContext {
    resumableStream(
      streamId: string,
      fallback: () => ReadableStream,
    ): Promise<ReadableStream | null>;
  }
  export function createResumableStreamContext(
    options: any,
  ): ResumableStreamContext;
}

// Add declarations for Next.js modules
declare module 'next/server' {
  export type {
    NextRequest,
    NextResponse,
  } from 'next/dist/server/web/spec-extension/request';
  export function NextResponse(...args: any[]): any;
}

declare module 'next/dist/server/web/spec-extension/request' {
  export interface NextRequest extends Request {
    nextUrl: URL;
  }

  export interface NextResponse extends Response {
    cookies: any;
  }
}

// Add React JSX global declarations
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
