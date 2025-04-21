import { formatDataStreamPart } from '@ai-sdk/ui-utils'
import { Client } from '@langchain/langgraph-sdk'
import { LangGraphStreamCallbacks, LangGraphStreamEvent } from './types'
import { generateUUID } from '../utils'
import { object } from 'zod'

// Remove the null option from our type to avoid the null assignment error
type FinishReason = 'stop' | 'length' | 'content_filter' | 'tool_calls'

export class LangGraphAdapter {
  private static async *deltaMessagesGenerator(
    streamResponse: AsyncGenerator<{ event: string; data: any }, any, any>,
    callbacks?: LangGraphStreamCallbacks
  ): AsyncGenerator<
    string,
    {
      usage?: { promptTokens: number; completionTokens: number }
      toolCalls?: Array<{ action: any; observation: string }>
    }
  > {
    let lastOutput = ''
    let usage = undefined
    let pendingToolCall: any = null
    let toolCalls: Array<{ action: any; observation: string }> = []
    let langgraph_node = ''
    let key_type = 'chat'

    for await (const message of streamResponse) {
      // Log each message to inspect structure

      if (message.event === 'messages/metadata') {
        console.log('\nLangGraph message event:', message.event)
        // console.log(
        //   'LangGraph message data:',
        //   JSON.stringify(message.data, null, 2)
        // )
        // Get the first key of the object if it exists
        const key = message.data ? Object.keys(message.data)[0] : undefined
        console.log('LangGraph message key:', key)
        key_type = key?.startsWith('run') ? 'run' : 'chat'
        const metadata = key ? message.data[key] : undefined
        langgraph_node = metadata?.node || ''

        console.log(
          'LangGraph message metadata:',
          JSON.stringify(metadata, null, 2)
        )
      } else if (message.event === 'messages/complete') {
        const data = message.data?.[0]

        // Check if this is an AI message with tool calls
        if (data?.type === 'ai' && data?.tool_calls?.length > 0) {
          pendingToolCall = {
            name: data.tool_calls[0].name,
            args: data.tool_calls[0].args
          }

          // Format the tool call as JSON and yield it
          yield formatDataStreamPart(
            'text',
            `\n\n**Tool Call:** ${
              pendingToolCall.name
            }\n\`\`\`json\n${JSON.stringify(
              pendingToolCall.args,
              null,
              2
            )}\n\`\`\`\n\n`
          )

          // Extract usage if available
          if (data.usage_metadata) {
            if (!usage) usage = { promptTokens: 0, completionTokens: 0 }
            usage.promptTokens += data.usage_metadata.input_tokens || 0
            usage.completionTokens += data.usage_metadata.output_tokens || 0
          }
        }
        // Check if this is a tool response
        // else if (data?.type === 'tool' && pendingToolCall) {
        //   const observation = data.content

        //   // Store the complete tool interaction
        //   toolCalls.push({
        //     action: pendingToolCall,
        //     observation: observation
        //   })

        //   // Format the tool result and yield it
        //   yield formatDataStreamPart(
        //     'text',
        //     `**Result:**\n\`\`\`\n${typeof observation === 'string' ? observation : JSON.stringify(observation, null, 2)}\n\`\`\`\n\n`
        //   )

        //   pendingToolCall = null
        // }
        // Regular AI message (final response)
        else if (data?.type === 'ai' && data?.content) {
          if (typeof data.content === 'string') {
            // Only yield content if we've already streamed all previous content
            if (data.content !== lastOutput) {
              const delta = data.content.substring(lastOutput.length)
              lastOutput = data.content
              if (delta) {
                if (callbacks?.onToken) {
                  callbacks.onToken(delta)
                }
                yield formatDataStreamPart('text', delta)
              }
            }
          }

          // Extract usage if available
          if (data.usage_metadata) {
            if (!usage) usage = { promptTokens: 0, completionTokens: 0 }
            usage.promptTokens += data.usage_metadata.input_tokens || 0
            usage.completionTokens += data.usage_metadata.output_tokens || 0
          }
        }
      } else if (message.event === 'messages/partial') {
        if (key_type === 'chat') {
          const msg = message.data?.[0]
          if (msg?.content && !pendingToolCall) {
            const current = msg.content
            const delta = current.substring(lastOutput.length)
            lastOutput = current
            if (delta) {
              if (callbacks?.onToken) {
                callbacks.onToken(delta)
              }
              yield formatDataStreamPart('text', delta)
            }
          }
        }
      }
    }

    // Return both usage information and tool calls
    return { usage, toolCalls }
  }

  private static async *fullDataStreamGenerator(
    streamResponse: AsyncGenerator<LangGraphStreamEvent, any, any>,
    messageId = generateUUID(),
    callbacks?: LangGraphStreamCallbacks,
    threadId?: string,
    client?: Client
  ): AsyncGenerator<string, void, unknown> {
    // Call onStart callback if provided
    if (callbacks?.onStart && threadId) {
      callbacks.onStart(messageId, threadId)
    }

    yield formatDataStreamPart('start_step', { messageId })

    // Default usage values in case we don't get them from the response
    let finishReason: FinishReason = 'stop'
    let extractedUsage:
      | { promptTokens: number; completionTokens: number }
      | undefined
    let extractedToolCalls: Array<{ action: any; observation: string }> = []

    try {
      // Create the generator but don't immediately start iterating
      const generator = this.deltaMessagesGenerator(streamResponse, callbacks)

      // Process all the deltas
      let result
      while (!(result = await generator.next()).done) {
        yield result.value
      }

      // After the generator is done, extract the usage and tool calls from the return value
      extractedUsage = result.value?.usage
      extractedToolCalls = result.value?.toolCalls || []

      console.log('Extracted usage from generator:', extractedUsage)
      console.log('Extracted tool calls from generator:', extractedToolCalls)

      // Use the extracted usage or fallback to default values
      const usage = extractedUsage || { promptTokens: 0, completionTokens: 0 }

      // If there were tool calls, set the finish reason accordingly
      if (extractedToolCalls.length > 0) {
        finishReason = 'tool_calls'
      }

      const stats = {
        finishReason,
        usage,
        toolCalls: extractedToolCalls
      }

      // Call onFinish callback if provided
      if (callbacks?.onFinish && threadId && client) {
        callbacks.onFinish(stats, threadId, client)
      }

      // Use type assertion to avoid TypeScript errors when passing to formatDataStreamPart
      yield formatDataStreamPart('finish_step', {
        finishReason,
        usage,
        toolCalls:
          extractedToolCalls.length > 0 ? extractedToolCalls : undefined,
        isContinued: false
      } as any)

      yield formatDataStreamPart('finish_message', {
        finishReason,
        usage,
        toolCalls:
          extractedToolCalls.length > 0 ? extractedToolCalls : undefined
      } as any)
    } catch (error) {
      // Call onError callback if provided
      if (callbacks?.onError) {
        callbacks.onError(error)
      }

      // Re-throw the error to be handled by the caller
      throw error
    }
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
    streamResponse: AsyncGenerator<LangGraphStreamEvent, any, any>,
    callbacks?: LangGraphStreamCallbacks,
    threadId?: string,
    client?: Client
  ): Response {
    const fullGenerator = this.fullDataStreamGenerator(
      streamResponse,
      undefined,
      callbacks,
      threadId,
      client
    )
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

// Allow streaming responses up to 30 seconds
export const maxDuration = 30
