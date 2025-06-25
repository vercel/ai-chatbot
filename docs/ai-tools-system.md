# AI Tools System Documentation

## Overview

This document provides a comprehensive guide to the AI tools system in the chatbot application. The system allows the AI to perform actions beyond simple text generation, including creating and updating documents, getting weather information, and requesting suggestions.

## Architecture

The AI tools system is built using the [AI SDK](https://sdk.vercel.ai/) and consists of:

1. **Tool Definitions** (`lib/ai/tools/`) - Individual tool implementations
2. **Tool Registration** (`app/(chat)/api/chat/route.ts`) - Integration with the chat API
3. **Artifact Handlers** (`lib/artifacts/server.ts`) - Specialized handlers for document operations
4. **Data Streaming** - Real-time communication with the frontend

## Core Components

### 1. Tool Structure

All tools follow the AI SDK's `tool()` function pattern:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

export const toolName = tool({
  description: 'Description of what the tool does',
  parameters: z.object({
    // Zod schema for parameters
  }),
  execute: async (params) => {
    // Tool implementation
    return result;
  },
});
```

### 2. Data Streaming

Tools that need to communicate with the frontend use `DataStreamWriter`:

```typescript
dataStream.writeData({
  type: 'data-type',
  content: data,
});
```

## Existing Tools

### 1. Get Weather (`get-weather.ts`)

**Purpose**: Fetches current weather data for a given location.

**Parameters**:
- `latitude: number` - Geographic latitude
- `longitude: number` - Geographic longitude

**Implementation**:
- Uses Open-Meteo API
- Returns temperature, hourly forecasts, and sunrise/sunset times
- No authentication required

**Usage in Chat Route**: `app/(chat)/api/chat/route.ts:166`

### 2. Create Document (`create-document.ts`)

**Purpose**: Creates new documents/artifacts (text, code, image, sheet).

**Parameters**:
- `title: string` - Document title
- `kind: ArtifactKind` - Type of document ('text', 'code', 'image', 'sheet')

**Implementation**:
- Generates unique document ID
- Uses artifact handlers for document-specific creation logic
- Streams document metadata to frontend
- Saves document to database

**Key Features**:
- Real-time document creation with streaming updates
- Supports multiple document types
- Integrates with artifact system

**Usage in Chat Route**: `app/(chat)/api/chat/route.ts:167`

### 3. Update Document (`update-document.ts`)

**Purpose**: Updates existing documents based on descriptions.

**Parameters**:
- `id: string` - Document ID to update
- `description: string` - Description of changes to make

**Implementation**:
- Retrieves existing document from database
- Uses artifact handlers for document-specific update logic
- Streams updates to frontend
- Saves updated content to database

**Usage in Chat Route**: `app/(chat)/api/chat/route.ts:168`

### 4. Request Suggestions (`request-suggestions.ts`)

**Purpose**: Generates writing suggestions for documents.

**Parameters**:
- `documentId: string` - ID of document to analyze

**Implementation**:
- Uses AI model to generate suggestions
- Streams suggestions in real-time
- Saves suggestions to database
- Limited to 5 suggestions per request

**Key Features**:
- Uses streaming objects for real-time suggestions
- Saves suggestions with user attribution
- Provides original text, suggested text, and descriptions

**Usage in Chat Route**: `app/(chat)/api/chat/route.ts:169-172`

## Chat Route Integration

### Tool Registration

Tools are registered in `app/(chat)/api/chat/route.ts:154-162`:

```typescript
experimental_activeTools: selectedChatModel === 'chat-model-reasoning'
  ? []
  : [
      'getWeather',
      'createDocument', 
      'updateDocument',
      'requestSuggestions',
    ],
```

### Tool Configuration

Tools are configured in the `tools` object (`route.ts:165-173`):

```typescript
tools: {
  getWeather,
  createDocument: createDocument({ session, dataStream }),
  updateDocument: updateDocument({ session, dataStream }),
  requestSuggestions: requestSuggestions({ session, dataStream }),
},
```

### Session and DataStream Injection

Document-related tools receive:
- `session: Session` - User authentication and authorization
- `dataStream: DataStreamWriter` - Real-time communication with frontend

## Artifact System Integration

### Document Handlers

Document tools integrate with the artifact system through handlers defined in `lib/artifacts/server.ts`:

- **Text Handler** (`artifacts/text/server.ts`)
- **Code Handler** (`artifacts/code/server.ts`) 
- **Image Handler** (`artifacts/image/server.ts`)
- **Sheet Handler** (`artifacts/sheet/server.ts`)

### Handler Interface

```typescript
export interface DocumentHandler<T = ArtifactKind> {
  kind: T;
  onCreateDocument: (args: CreateDocumentCallbackProps) => Promise<void>;
  onUpdateDocument: (args: UpdateDocumentCallbackProps) => Promise<void>;
}
```

## Creating New Tools

### Step 1: Define the Tool

Create a new file in `lib/ai/tools/your-tool.ts`:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

export const yourTool = tool({
  description: 'Clear description of what your tool does',
  parameters: z.object({
    // Define your parameters with Zod validation
    param1: z.string().describe('Description of parameter'),
    param2: z.number().optional(),
  }),
  execute: async ({ param1, param2 }) => {
    // Implement your tool logic here
    
    // For tools that need to communicate with frontend:
    // dataStream.writeData({ type: 'your-type', content: data });
    
    return {
      // Return data that will be included in the conversation
      result: 'Tool execution result',
    };
  },
});
```

### Step 2: Add Tool Dependencies (if needed)

For tools requiring session or data streaming:

```typescript
interface YourToolProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const yourTool = ({ session, dataStream }: YourToolProps) =>
  tool({
    // ... tool definition
    execute: async (params) => {
      // Use session for user context
      const userId = session.user?.id;
      
      // Use dataStream for real-time updates
      dataStream.writeData({
        type: 'progress',
        content: 'Processing...',
      });
      
      // ... rest of implementation
    },
  });
```

### Step 3: Register in Chat Route

1. **Import the tool** in `app/(chat)/api/chat/route.ts`:
```typescript
import { yourTool } from '@/lib/ai/tools/your-tool';
```

2. **Add to active tools array** (`route.ts:154-162`):
```typescript
experimental_activeTools: [
  'getWeather',
  'createDocument',
  'updateDocument', 
  'requestSuggestions',
  'yourTool', // Add your tool name
],
```

3. **Configure in tools object** (`route.ts:165-173`):
```typescript
tools: {
  getWeather,
  createDocument: createDocument({ session, dataStream }),
  updateDocument: updateDocument({ session, dataStream }),
  requestSuggestions: requestSuggestions({ session, dataStream }),
  yourTool: yourTool({ session, dataStream }), // Configure your tool
},
```

### Step 4: Handle Frontend Integration (if needed)

If your tool sends data to the frontend via `dataStream.writeData()`, you may need to update:

1. **Data Stream Handler** (`components/data-stream-handler.tsx`) - To handle new data types
2. **Frontend Components** - To display or react to the new data

## Best Practices

### Security
- Always validate user input with Zod schemas
- Check user permissions using the `session` object
- Sanitize external API responses
- Never expose sensitive information in tool returns

### Performance
- Use streaming for long-running operations
- Implement proper error handling
- Consider rate limiting for external API calls
- Cache frequently accessed data when appropriate

### User Experience
- Provide clear, descriptive tool descriptions
- Use streaming to show progress for long operations
- Return meaningful success/error messages
- Consider the conversational context in tool responses

### Database Operations
- Use existing query functions from `lib/db/queries.ts`
- Always handle database errors gracefully
- Consider transaction boundaries for multi-step operations
- Follow the existing schema patterns

## Testing Tools

### Unit Testing
- Test tool parameter validation
- Mock external dependencies
- Test error handling scenarios
- Verify return value formats

### Integration Testing
- Test tool integration with chat route
- Verify data streaming functionality
- Test session and permission handling
- End-to-end testing with frontend components

## Troubleshooting

### Common Issues

1. **Tool not appearing in chat**: Check tool registration in chat route
2. **Parameter validation errors**: Verify Zod schema matches expected input
3. **Database errors**: Check user permissions and query implementation
4. **Streaming not working**: Verify DataStreamWriter usage and frontend handling

### Debugging Tips

- Use console.log in tool execution for debugging
- Check browser network tab for streaming data
- Verify tool descriptions are clear and accurate
- Test with different user types and permissions

## Example: Weather Tool Analysis

The weather tool demonstrates a simple external API integration:

```typescript
// lib/ai/tools/get-weather.ts:4-18
export const getWeather = tool({
  description: 'Get the current weather at a location',
  parameters: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  execute: async ({ latitude, longitude }) => {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
    );
    const weatherData = await response.json();
    return weatherData;
  },
});
```

**Key Points**:
- Simple parameter schema (latitude/longitude)
- External API call to Open-Meteo
- Direct return of API response
- No session or streaming dependencies
- Registered as `'getWeather'` in chat route

This tool shows the minimal pattern for external data integration without complex frontend interactions.