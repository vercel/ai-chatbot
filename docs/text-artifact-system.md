# Text Artifact System Documentation

## Overview

The text artifact system enables AI-powered creation and editing of text documents within the chat interface. It supports streaming content generation, version control, collaborative editing, and AI-powered suggestions.

## Architecture

### Core Components

1. **Client-side Implementation** (`artifacts/text/client.tsx`)
2. **Server-side Handler** (`artifacts/text/server.ts`)
3. **AI Tools** (`lib/ai/tools/`)
4. **Chat Integration** (chat route and message components)

## Implementation Details

### Client-side Text Artifact (`artifacts/text/client.tsx:21`)

The `textArtifact` is defined as an Artifact instance with the following characteristics:

#### Configuration
- **Kind**: `'text'`
- **Description**: "Useful for text content, like drafting essays and emails."

#### Initialization (`artifacts/text/client.tsx:24`)
```typescript
initialize: async ({ documentId, setMetadata }) => {
  const suggestions = await getSuggestions({ documentId });
  setMetadata({ suggestions });
}
```

#### Stream Processing (`artifacts/text/client.tsx:31`)
Handles two types of stream data:
- **`suggestion`**: Adds AI-generated suggestions to metadata
- **`text-delta`**: Appends text content and manages visibility state

#### Content Rendering (`artifacts/text/client.tsx:59`)
- **Loading State**: Shows `DocumentSkeleton`
- **Diff Mode**: Displays version comparison using `DiffView`
- **Edit Mode**: Renders `Editor` component with suggestions

#### Actions (`artifacts/text/client.tsx:101`)
- **View Changes**: Toggle diff mode (disabled for first version)
- **Previous/Next Version**: Navigate between versions
- **Copy to Clipboard**: Copy current content

#### Toolbar (`artifacts/text/client.tsx:153`)
- **Add Final Polish**: Triggers AI grammar and structure improvements
- **Request Suggestions**: Asks AI for writing improvement suggestions

### Server-side Handler (`artifacts/text/server.ts:6`)

The `textDocumentHandler` uses `createDocumentHandler` with:

#### Document Creation (`artifacts/text/server.ts:8`)
```typescript
onCreateDocument: async ({ title, dataStream }) => {
  const { fullStream } = streamText({
    model: myProvider.languageModel('artifact-model'),
    system: 'Write about the given topic. Markdown is supported...',
    prompt: title,
  });
  // Streams text-delta events to client
}
```

#### Document Updates (`artifacts/text/server.ts:36`)
```typescript
onUpdateDocument: async ({ document, description, dataStream }) => {
  const { fullStream } = streamText({
    model: myProvider.languageModel('artifact-model'),
    system: updateDocumentPrompt(document.content, 'text'),
    prompt: description,
  });
  // Streams updated content with prediction optimization
}
```

### AI Tools Integration

#### Create Document Tool (`lib/ai/tools/create-document.ts:15`)
- **Purpose**: Creates new documents when AI determines it's appropriate
- **Parameters**: `title` (string), `kind` (artifact type enum)
- **Flow**: Generates UUID → streams metadata → calls document handler → returns result

#### Update Document Tool (`lib/ai/tools/update-document.ts:12`)
- **Purpose**: Updates existing documents based on user requests
- **Parameters**: `id` (document ID), `description` (change description)
- **Flow**: Fetches document → validates → calls document handler → returns result

### Chat Route Integration (`app/(chat)/api/chat/route.ts:22-24`)

The main chat API route includes both tools:
```typescript
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
```

Tools are configured with session and data stream for real-time updates.

## Data Flow

### Document Creation Flow
1. User requests text content creation
2. AI decides to use `createDocument` tool
3. Tool generates UUID and streams metadata (`kind`, `id`, `title`, `clear`)
4. Server handler generates content using AI model
5. Content streams as `text-delta` events
6. Client updates artifact state and renders content
7. Tool finishes with completion message

### Document Update Flow  
1. User requests document changes
2. AI uses `updateDocument` tool with document ID and description
3. Tool fetches existing document from database
4. Server handler generates updated content with prediction optimization
5. New content streams to client
6. Client renders updated version
7. Version history maintained for comparison

### Streaming Architecture
- **Server**: Uses `smoothStream` with word-based chunking
- **Client**: Processes `text-delta` events to build content incrementally
- **Visibility**: Content becomes visible after 400-450 characters for better UX

## Message Integration

### Message Rendering (`components/message.tsx:173-231`)
Tool calls and results are rendered as special message components:
- Shows document creation/update progress
- Displays inline document previews
- Provides links to open artifacts in full-screen mode

### Document Preview (`components/document-preview.tsx`)
Renders compact preview of text documents within chat messages before full-screen editing.

## Usage Guidelines

### When to Use Text Artifacts
- Long-form content creation (essays, articles, documentation)
- Structured text that benefits from editing capabilities
- Content requiring multiple revisions or collaboration
- Documents that need AI-powered suggestions

### Creating New Text Documents
```typescript
// AI will automatically create when appropriate, or you can trigger via:
appendMessage({
  role: 'user',
  content: 'Create a blog post about sustainable energy'
});
```

### Updating Existing Documents
```typescript
// Reference existing document for updates:
appendMessage({
  role: 'user', 
  content: 'Make the introduction more engaging and add statistics'
});
```

## Modification Guidelines

### Adding New Text Features

1. **Client-side Changes** (`artifacts/text/client.tsx`):
   - Add new toolbar actions in `toolbar` array
   - Extend `TextArtifactMetadata` interface for new data
   - Handle additional stream types in `onStreamPart`

2. **Server-side Changes** (`artifacts/text/server.ts`):
   - Modify system prompts for different behavior
   - Add new stream data types
   - Implement additional AI model configurations

3. **Integration Changes**:
   - Update tool schemas for new parameters
   - Modify message rendering for new features
   - Add new API routes if needed

### Extending Stream Handling

```typescript
// In client.tsx onStreamPart:
if (streamPart.type === 'custom-event') {
  setMetadata((metadata) => ({
    ...metadata,
    customData: streamPart.content
  }));
}
```

### Adding New Actions

```typescript
// In client.tsx actions array:
{
  icon: <CustomIcon size={18} />,
  description: 'Custom action',
  onClick: ({ content, appendMessage }) => {
    // Custom logic here
  },
  isDisabled: ({ status }) => status === 'streaming'
}
```

## Best Practices

### Performance
- Use streaming for large documents
- Implement proper loading states
- Optimize re-renders with React.memo where appropriate

### User Experience
- Provide clear visual feedback during generation
- Support keyboard shortcuts in edit mode
- Maintain version history for undo functionality

### Error Handling
- Validate document existence before updates
- Handle network failures gracefully
- Provide fallback content for failed generations

### Security
- Sanitize user input in prompts
- Validate document permissions
- Rate limit AI tool usage

## Testing

### Unit Tests
- Test artifact initialization
- Verify stream processing logic
- Test action handlers

### Integration Tests
- Test document creation flow
- Verify update mechanisms
- Test chat integration

### E2E Tests
- Test full user workflows
- Verify streaming behavior
- Test version navigation

## Common Issues and Solutions

### Stream Not Updating
- Verify data stream is properly connected
- Check for client-side state management issues
- Ensure server handler is streaming correctly

### Version History Issues
- Confirm document versioning is enabled
- Check database schema for version fields
- Verify version comparison logic

### Performance Problems
- Optimize large document handling
- Implement content virtualization if needed
- Review re-render patterns

## Future Enhancements

### Potential Features
- Real-time collaborative editing
- Enhanced suggestion system
- Template-based document creation
- Export functionality (PDF, Word, etc.)
- Advanced formatting options
- Integration with external writing tools

### Architecture Improvements
- Separate content storage from metadata
- Implement proper caching strategies
- Add offline support capabilities
- Enhanced error recovery mechanisms