declare module '@/lib/stream-data' {
  export interface DataMessage {
    type: string;
    [key: string]: any;
  }

  export interface DataStreamOptions {
    sendReasoning?: boolean;
    [key: string]: any;
  }

  export function createDataStream(options: {
    execute: (context: {
      writeData: (data: DataMessage) => void;
    }) => Promise<void> | void;
    onError?: (error: unknown) => string;
  }): ReadableStream;

  export function createStreamDataStream(options?: DataStreamOptions): {
    writeData: (data: DataMessage) => void;
    mergeIntoDataStream: (dataStream: any, options?: DataStreamOptions) => void;
  };
}
