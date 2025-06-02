# LangSmith Observability Setup

This guide will help you set up LangSmith for observability in your AI chatbot application.

## Prerequisites

1. Create a LangSmith account at [smith.langchain.com](https://smith.langchain.com)
2. Get your LangSmith API key from the settings page

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# LangSmith Configuration
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-langsmith-api-key-here

# Optional: Set log level for debugging
# OTEL_LOG_LEVEL=DEBUG
```

## What's Already Configured

The following components have been updated to include LangSmith telemetry:

### 1. Instrumentation Setup
- `instrumentation.ts` - Configured with AISDKExporter for OpenTelemetry
- `next.config.ts` - Ready for instrumentation (Next.js 15+ handles this automatically)

### 2. AI SDK Calls with Telemetry
- **Chat API** (`app/(chat)/api/chat/route.ts`) - Main chat endpoint with user context
- **Title Generation** (`app/(chat)/actions.ts`) - Automatic title generation
- **Text Documents** (`artifacts/text/server.ts`) - Text artifact creation and updates
- **Code Documents** (`artifacts/code/server.ts`) - Code artifact creation and updates
- **Suggestions** (`lib/ai/tools/request-suggestions.ts`) - Document suggestion generation
- **Memory Classification** (`lib/ai/memory-classifier.ts`) - User memory processing and classification

### 3. Metadata Tracking
Each trace includes relevant metadata:
- User ID and type
- Chat ID
- Model used
- Document titles/descriptions
- Custom run names for easy filtering

## Viewing Traces

Once configured, you'll see traces in your LangSmith dashboard with:

1. **Run Names** for easy identification:
   - `chat-{model-name}` - Main chat interactions
   - `generate-title` - Title generation
   - `create-text-document` / `update-text-document` - Text artifacts
   - `create-code-document` / `update-code-document` - Code artifacts
   - `request-suggestions` - Document suggestions
   - `classify-memory` - Memory classification from user messages
   - `consolidate-memory` - Memory consolidation and deduplication

2. **Metadata** for filtering and analysis:
   - User information
   - Chat context
   - Model performance
   - Document operations
   - Memory processing metrics (message length, existing memories count, categories)

## Debugging

If traces aren't appearing:

1. Verify your `LANGCHAIN_API_KEY` is correct
2. Check that `LANGCHAIN_TRACING_V2=true` is set
3. Enable debug logging with `OTEL_LOG_LEVEL=DEBUG`
4. Check the browser console and server logs for errors

## Advanced Configuration

### Custom Run IDs
You can customize run IDs for specific tracking:

```typescript
experimental_telemetry: AISDKExporter.getSettings({
  runId: uuidv4(), // Custom UUID
  runName: 'custom-operation',
  metadata: { customField: 'value' }
})
```

### Nested Runs
Use the `traceable` function for complex operations:

```typescript
import { traceable } from 'langsmith/traceable';

const wrappedFunction = traceable(
  async (input: string) => {
    // Your AI SDK calls here
    return result;
  },
  { name: 'custom-operation' }
);
```

## Benefits

With LangSmith observability, you can:

- Monitor AI model performance and costs
- Debug conversation flows
- Analyze user interaction patterns
- Track document generation quality
- Optimize prompts based on real usage data
- Set up alerts for errors or performance issues

## Next Steps

1. Set up your environment variables
2. Deploy your application
3. Start a conversation to generate your first traces
4. Explore the LangSmith dashboard to analyze your AI application's behavior

For more advanced features, check out:
- [LangSmith Evaluation](https://docs.smith.langchain.com/evaluation)
- [Dataset Management](https://docs.smith.langchain.com/datasets)
- [Prompt Management](https://docs.smith.langchain.com/prompts) 