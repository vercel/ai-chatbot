# AI SDK streamText Function Guide

## Overview

The `streamText` function is a core component of Vercel's AI SDK that enables real-time streaming of text generation from language models. It's designed for interactive use cases like chatbots, live content generation, and real-time AI applications.

## Key Features

- **Real-time streaming**: Immediately starts streaming text as it's generated
- **Error resilience**: Errors become part of the stream instead of crashing the application
- **Tool integration**: Supports AI tools and function calling
- **Multiple model support**: Works with OpenAI, Anthropic, Google, and other providers
- **Flexible responses**: Multiple output formats and integration options

## Basic Usage

### Installation

```bash
npm install ai @ai-sdk/openai
# or
pnpm add ai @ai-sdk/openai
```

### Simple Example

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { textStream } = streamText({
  model: openai('gpt-4o'),
  prompt: 'Write a short story about a robot learning to paint.'
});

for await (const textPart of textStream) {
  process.stdout.write(textPart);
}
```

## Core Parameters

### Required Parameters

- `model`: The language model to use (e.g., `openai('gpt-4o')`, `anthropic('claude-3-sonnet')`)

### Common Parameters

- `system`: System message defining the AI's behavior
- `prompt`: Simple text prompt for generation
- `messages`: Array of conversation messages for chat scenarios
- `temperature`: Controls randomness (0-2, default varies by model)
- `maxTokens`: Maximum tokens to generate
- `topP`: Nucleus sampling parameter
- `frequencyPenalty`: Reduces repetition
- `presencePenalty`: Encourages topic diversity

### Advanced Parameters

- `tools`: Array of tools/functions the AI can call
- `toolChoice`: Controls tool usage ('auto', 'none', or specific tool)
- `seed`: For reproducible outputs
- `abortSignal`: For cancelling requests
- `headers`: Custom HTTP headers

## Stream Types

### Text Stream
```typescript
const { textStream } = streamText({
  model: openai('gpt-4o'),
  prompt: 'Explain quantum computing'
});

// Returns only text deltas
for await (const textPart of textStream) {
  console.log(textPart);
}
```

### Full Stream
```typescript
const { fullStream } = streamText({
  model: openai('gpt-4o'),
  prompt: 'Analyze this data',
  tools: { /* tool definitions */ }
});

// Returns comprehensive stream events
for await (const delta of fullStream) {
  switch (delta.type) {
    case 'text-delta':
      console.log('Text:', delta.textDelta);
      break;
    case 'tool-call':
      console.log('Tool call:', delta.toolCall);
      break;
    case 'tool-result':
      console.log('Tool result:', delta.toolResult);
      break;
  }
}
```

## Response Methods

### For Next.js API Routes

```typescript
// Simple text response
return result.toTextStreamResponse();

// Rich data stream with tool calls
return result.toDataStreamResponse();

// Custom headers
return result.toTextStreamResponse({
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
  }
});
```

### For Node.js Applications

```typescript
// Pipe to response object
result.pipeDataStreamToResponse(response);

// Manual streaming
const stream = result.toDataStream();
stream.pipeTo(response);
```

## Project Implementation Analysis

### Current Setup in This Project

The project uses a sophisticated setup with custom providers and middleware:

**File: `lib/ai/providers.ts`**
- Uses Portkey as a gateway to Claude Sonnet 4
- Implements reasoning middleware for structured thinking
- Supports multiple model types (chat, reasoning, title, artifact)
- Configurable for test and production environments

```typescript
// Current model configuration
const chatModel = portkey.chatModel('us.anthropic.claude-sonnet-4-20250514-v1:0');

export const myProvider = customProvider({
  languageModels: {
    'chat-model': chatModel,
    'chat-model-reasoning': wrapLanguageModel({
      model: chatModel,
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': chatModel,
    'artifact-model': chatModel,
  },
  imageModels: {
    'small-model': openai.image('gpt-4o-mini'),
  },
});
```

**File: `app/(chat)/api/chat/route.ts`**
The main chat route implements streamText with:
- Tool integration for documents, weather, charts, and Snowflake SQL
- Message persistence to database
- Reasoning capabilities
- Artifact creation and updates

### Key Tools Integration

1. **Document Management**: `createDocument`, `updateDocument`
2. **Weather Data**: `getWeather`
3. **Chart Generation**: `getChart`
4. **SQL Execution**: `snowflakeSqlRunner`
5. **Suggestions**: `requestSuggestions`

## Error Handling and Debugging

### Built-in Error Handling

```typescript
const result = streamText({
  model: openai('gpt-4o'),
  prompt: 'Generate content',
  onError: (error) => {
    console.error('Stream error:', error);
    // Log to monitoring service
    // Send to error tracking
  }
});
```

### Common Error Scenarios

1. **Model Rate Limits**: Handle 429 responses gracefully
2. **Network Issues**: Implement retry logic
3. **Invalid Parameters**: Validate inputs before streaming
4. **Token Limits**: Monitor token usage and implement truncation

### Debugging Techniques

#### 1. Stream Event Logging

```typescript
const { fullStream } = streamText({
  model: openai('gpt-4o'),
  prompt: 'Debug this response',
  onChunk: (chunk) => {
    console.log('Chunk received:', chunk);
  },
  onFinish: (result) => {
    console.log('Stream finished:', {
      usage: result.usage,
      finishReason: result.finishReason,
      responseMessages: result.responseMessages
    });
  }
});
```

#### 2. Request/Response Inspection

```typescript
// Enable debug logging
process.env.AI_SDK_DEBUG = 'true';

// Or use custom logging
const result = streamText({
  model: openai('gpt-4o'),
  prompt: 'Test prompt',
  experimental_telemetry: {
    isEnabled: true,
    functionId: 'chat-function',
    metadata: {
      userId: 'user-123',
      sessionId: 'session-456'
    }
  }
});
```

#### 3. Tool Call Debugging

```typescript
const tools = {
  debugTool: {
    description: 'Debug tool for testing',
    parameters: z.object({
      input: z.string()
    }),
    execute: async ({ input }) => {
      console.log('Tool called with:', input);
      return { result: 'Debug successful', input };
    }
  }
};

const { fullStream } = streamText({
  model: openai('gpt-4o'),
  prompt: 'Use the debug tool',
  tools,
  onToolCall: ({ toolCall }) => {
    console.log('Tool call initiated:', toolCall);
  },
  onToolResult: ({ toolResult }) => {
    console.log('Tool result received:', toolResult);
  }
});
```

## Data Modification and Processing

### Message Transformation

```typescript
// Pre-process messages before streaming
const processedMessages = messages.map(msg => ({
  ...msg,
  content: sanitizeContent(msg.content),
  timestamp: new Date().toISOString()
}));

const result = streamText({
  model: openai('gpt-4o'),
  messages: processedMessages
});
```

### Response Processing

```typescript
// Process text as it streams
const { textStream } = streamText({
  model: openai('gpt-4o'),
  prompt: 'Generate markdown content'
});

let accumulatedText = '';
for await (const textPart of textStream) {
  accumulatedText += textPart;
  
  // Real-time processing
  if (accumulatedText.includes('\n## ')) {
    console.log('New section detected');
  }
  
  // Emit processed chunks
  emitProcessedChunk(processMarkdown(textPart));
}
```

### Tool Result Modification

```typescript
const tools = {
  dataProcessor: {
    description: 'Process and transform data',
    parameters: z.object({
      data: z.array(z.any()),
      operation: z.enum(['filter', 'transform', 'aggregate'])
    }),
    execute: async ({ data, operation }) => {
      switch (operation) {
        case 'filter':
          return data.filter(item => item.active);
        case 'transform':
          return data.map(item => ({ ...item, processed: true }));
        case 'aggregate':
          return { total: data.length, sum: data.reduce((a, b) => a + b.value, 0) };
        default:
          return data;
      }
    }
  }
};
```

## Error Tracing and Monitoring

### Custom Error Handler

```typescript
class StreamErrorHandler {
  private errors: Array<{ timestamp: Date; error: any; context: any }> = [];
  
  logError(error: any, context: any) {
    this.errors.push({
      timestamp: new Date(),
      error,
      context
    });
    
    // Send to monitoring service
    this.sendToMonitoring(error, context);
  }
  
  private sendToMonitoring(error: any, context: any) {
    // Implementation for your monitoring service
    console.error('Stream Error:', { error, context });
  }
  
  getErrorHistory() {
    return this.errors;
  }
}

const errorHandler = new StreamErrorHandler();

const result = streamText({
  model: openai('gpt-4o'),
  prompt: 'Generate content',
  onError: (error) => {
    errorHandler.logError(error, {
      model: 'gpt-4o',
      timestamp: new Date(),
      prompt: 'Generate content'
    });
  }
});
```

### Performance Monitoring

```typescript
const startTime = Date.now();
let firstChunkTime: number | null = null;
let chunkCount = 0;

const { textStream } = streamText({
  model: openai('gpt-4o'),
  prompt: 'Performance test',
  onChunk: (chunk) => {
    if (firstChunkTime === null) {
      firstChunkTime = Date.now();
      console.log('Time to first chunk:', firstChunkTime - startTime, 'ms');
    }
    chunkCount++;
  },
  onFinish: (result) => {
    const totalTime = Date.now() - startTime;
    console.log('Performance metrics:', {
      totalTime: totalTime + 'ms',
      timeToFirstChunk: firstChunkTime ? firstChunkTime - startTime + 'ms' : 'N/A',
      chunkCount,
      tokensPerSecond: result.usage?.totalTokens ? (result.usage.totalTokens / (totalTime / 1000)).toFixed(2) : 'N/A'
    });
  }
});
```

## Best Practices

1. **Always handle errors gracefully**: Use onError callbacks and try-catch blocks
2. **Monitor token usage**: Track costs and implement limits
3. **Implement timeouts**: Use AbortController for request cancellation
4. **Cache when appropriate**: Store responses for repeated requests
5. **Validate inputs**: Sanitize user inputs before processing
6. **Log comprehensively**: Track all interactions for debugging
7. **Use environment-specific configurations**: Different settings for dev/prod
8. **Implement retry logic**: Handle transient failures automatically
9. **Monitor performance**: Track response times and optimize accordingly
10. **Security first**: Never expose API keys or sensitive data

## Integration with This Project

To modify or extend the streamText usage in this project:

1. **Add new models**: Update `lib/ai/providers.ts`
2. **Create new tools**: Add to `lib/ai/tools/` directory
3. **Modify system prompts**: Update `lib/ai/prompts.ts`
4. **Extend chat functionality**: Modify `app/(chat)/api/chat/route.ts`
5. **Add error handling**: Implement in the chat route and components
6. **Monitor usage**: Add telemetry and logging as needed

The project's architecture provides a solid foundation for AI streaming with proper separation of concerns, tool integration, and error handling.