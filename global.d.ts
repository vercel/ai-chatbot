/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

// Web Stream API
interface ReadableStreamDefaultController<R = any> {
  close(): void;
  enqueue(chunk: R): void;
  error(e?: any): void;
}

// Add JSX type declarations
namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// React type declarations
namespace React {
  interface ReactNode {
    children?: ReactNode;
  }
}

// Extend Window for any custom global variables
interface Window {
  // Add any custom global variables here if needed
  __NEXT_DATA__?: any;
}

// Declare additional types that might be missing
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

// Add support for importing CSS modules
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Make sure process is defined globally
declare global {
  interface Process {
    env: {
      NODE_ENV: 'development' | 'production' | 'test';
      REDIS_URL?: string;
      UPSTASH_REDIS_REST_URL?: string;
      TRACE_AI?: string;
      DEBUG_AI?: string;
      SMOOTH_STREAMING?: string;
      OPENAI_API_KEY?: string;
      XAI_API_KEY?: string;
      GOOGLE_API_KEY?: string;
      ANTHROPIC_API_KEY?: string;
      [key: string]: string | undefined;
    };
    [key: string]: any;
  }

  const process: Process;
}
