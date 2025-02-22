import { formatDataStreamPart } from 'ai'
import { generateUUID } from '@/lib/utils'

type LangGraphStreamEvent = {
  event: string
  data: any
}

export class LangGraphAdapter {
  private static async *deltaMessagesGenerator(
    streamResponse: AsyncGenerator<{ event: string; data: any }, any, any>
  ): AsyncGenerator<string, void, unknown> {
    let lastOutput = ''
    for await (const message of streamResponse) {
      if (message.event !== 'messages/complete') {
        const msg = message.data?.[0]
        if (msg?.content) {
          const current = msg.content
          const delta = current.substring(lastOutput.length)
          lastOutput = current
          if (delta) {
            yield formatDataStreamPart('text', delta)
          }
        }
      }
    }
  }

  private static async *fullDataStreamGenerator(
    streamResponse: AsyncGenerator<LangGraphStreamEvent, any, any>,
    messageId = generateUUID()
  ): AsyncGenerator<string, void, unknown> {
    yield formatDataStreamPart('start_step', { messageId })

    for await (const delta of this.deltaMessagesGenerator(streamResponse)) {
      yield delta
    }

    yield formatDataStreamPart('finish_step', {
      finishReason: 'stop',
      usage: { promptTokens: 55, completionTokens: 20 },
      isContinued: false
    })

    yield formatDataStreamPart('finish_message', {
      finishReason: 'stop',
      usage: { promptTokens: 55, completionTokens: 20 }
    })
  }

  private static asyncGeneratorToReadableStream(
    generator: AsyncGenerator<string, any, any>
  ): ReadableStream<string> {
    return new ReadableStream<string>({
      async pull(controller) {
        const { done, value } = await generator.next()
        if (done) {
          controller.close()
        } else {
          controller.enqueue(value)
        }
      },
      async cancel(reason) {
        if (generator.return) {
          await generator.return(reason)
        }
      }
    })
  }

  private static prepareResponseHeaders(
    headers: HeadersInit | undefined,
    {
      contentType,
      dataStreamVersion
    }: { contentType: string; dataStreamVersion?: 'v1' | undefined }
  ) {
    const responseHeaders = new Headers(headers ?? {})
    if (!responseHeaders.has('Content-Type')) {
      responseHeaders.set('Content-Type', contentType)
    }
    if (dataStreamVersion !== undefined) {
      responseHeaders.set('X-Vercel-AI-Data-Stream', dataStreamVersion)
    }
    return responseHeaders
  }

  static toDataStreamResponse(
    streamResponse: AsyncGenerator<LangGraphStreamEvent, any, any>
  ): Response {
    const fullGenerator = this.fullDataStreamGenerator(streamResponse)
    const readableStream = this.asyncGeneratorToReadableStream(fullGenerator)
    const responseStream = readableStream.pipeThrough(new TextEncoderStream())

    return new Response(responseStream, {
      status: 200,
      statusText: 'OK',
      headers: this.prepareResponseHeaders(
        {},
        {
          contentType: 'text/plain; charset=utf-8',
          dataStreamVersion: 'v1'
        }
      )
    })
  }
}
