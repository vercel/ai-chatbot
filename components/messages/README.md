# Message Components Architecture

This folder contains the refactored message components, breaking down the large `message.tsx` component into smaller, more maintainable pieces following clean code principles.

## Component Structure

```
components/messages/
├── README.md                     # This documentation
├── index.ts                      # Main exports
├── types.ts                      # TypeScript interfaces
├── message-container.tsx         # Container with animations and layout
├── message-avatar.tsx           # Assistant avatar component
├── message-attachments.tsx      # File attachments display
├── message-content.tsx          # Main content wrapper
├── message-parts.tsx            # Message parts coordinator
├── parts/                       # Message part renderers
│   ├── index.ts
│   ├── text-part.tsx           # Text content with edit functionality
│   ├── reasoning-part.tsx      # AI reasoning display
│   └── tool-invocation-part.tsx # Tool call coordinator
└── tool-invocations/            # Tool-specific renderers
    ├── index.ts
    ├── tool-call-renderer.tsx   # Tool call states
    └── tool-result-renderer.tsx # Tool result states
```

## Core Components

### MessageContainer
**Purpose**: Provides the outer container with animations and responsive layout.
**Props**: `message`, `mode`, `children`
**Responsibilities**:
- Framer Motion animations (fade in, slide up)
- Responsive layout (max-width, padding)
- Edit mode layout adjustments

### MessageAvatar
**Purpose**: Displays the assistant's avatar icon.
**Props**: `role`
**Responsibilities**:
- Shows SparklesIcon for assistant messages
- Returns null for user messages
- Consistent styling with ring border

### MessageAttachments
**Purpose**: Renders file attachments above message content.
**Props**: `message`
**Responsibilities**:
- Handles `experimental_attachments` array
- Uses existing `PreviewAttachment` component
- Returns null if no attachments

### MessageContent
**Purpose**: Main content wrapper that coordinates all message parts.
**Props**: `message`, `chatId`, `vote`, `isLoading`, `isReadonly`, `requiresScrollPadding`, `mode`, `setMode`, `setMessages`, `reload`
**Responsibilities**:
- Manages content layout and minimum height
- Coordinates attachments, parts, and actions
- Passes through props to child components

### MessageParts
**Purpose**: Renders different types of message parts (text, reasoning, tool-invocations).
**Props**: `message`, `mode`, `setMode`, `isLoading`, `isReadonly`, `setMessages`, `reload`
**Responsibilities**:
- Iterates through `message.parts` array
- Routes to appropriate part renderer
- Generates unique keys for React rendering

## Part Renderers

### TextPart
**Purpose**: Handles text content with view/edit modes.
**Props**: `message`, `text`, `partKey`, `mode`, `setMode`, `isReadonly`, `setMessages`, `reload`
**Features**:
- View mode: Markdown rendering with edit button
- Edit mode: MessageEditor integration
- User message styling (rounded, colored background)
- Edit button only for user messages when not readonly

### ReasoningPart
**Purpose**: Displays AI reasoning content.
**Props**: `partKey`, `reasoning`, `isLoading`
**Responsibilities**:
- Wraps existing `MessageReasoning` component
- Passes through reasoning text and loading state

### ToolInvocationPart
**Purpose**: Coordinates tool call and result rendering.
**Props**: `toolInvocation`, `isReadonly`
**Responsibilities**:
- Determines if tool is in 'call' or 'result' state
- Routes to appropriate tool renderer
- Passes through tool-specific data

## Tool Invocation Renderers

### ToolCallRenderer
**Purpose**: Renders tool calls in 'call' state.
**Supported Tools**:
- `getWeather` → Weather component
- `getChart` → Chart component
- `createDocument` → DocumentPreview
- `updateDocument` → DocumentToolCall
- `requestSuggestions` → DocumentToolCall
- `snowflakeSqlTool` → SnowflakeSqlCall
- Default → McpToolCall (for MCP tools)

### ToolResultRenderer
**Purpose**: Renders tool results in 'result' state.
**Supported Tools**: Same as ToolCallRenderer but with result components
- Maps to corresponding result components (Weather, Chart, DocumentPreview, etc.)

## Type Definitions

### BaseMessageProps
Core props interface for message components:
```typescript
interface BaseMessageProps {
  chatId: string;
  message: UIMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}
```

### MessageMode
Edit mode state management:
```typescript
interface MessageMode {
  mode: 'view' | 'edit';
  setMode: (mode: 'view' | 'edit') => void;
}
```

### ToolInvocationProps
Tool-specific props:
```typescript
interface ToolInvocationProps {
  toolName: string;
  toolCallId: string;
  state: 'call' | 'result';
  args?: any;
  result?: any;
  isReadonly: boolean;
}
```

## Adding New Components

### Adding a New Message Part Type

1. **Create the part renderer** in `components/messages/parts/`:
   ```typescript
   // new-part.tsx
   'use client';
   
   interface NewPartProps {
     partKey: string;
     // Add specific props for your part type
     data: any;
     isReadonly: boolean;
   }
   
   export function NewPart({ partKey, data, isReadonly }: NewPartProps) {
     return (
       <div key={partKey}>
         {/* Your component implementation */}
       </div>
     );
   }
   ```

2. **Export from parts index**:
   ```typescript
   // parts/index.ts
   export { NewPart } from './new-part';
   ```

3. **Add to MessageParts renderer**:
   ```typescript
   // message-parts.tsx
   if (type === 'new-part-type') {
     return (
       <NewPart
         key={key}
         partKey={key}
         data={part.data}
         isReadonly={isReadonly}
       />
     );
   }
   ```

### Adding a New Tool Invocation

1. **Add to ToolCallRenderer**:
   ```typescript
   // tool-invocations/tool-call-renderer.tsx
   case 'newToolName':
     return <NewToolCall args={args} isReadonly={isReadonly} />;
   ```

2. **Add to ToolResultRenderer**:
   ```typescript
   // tool-invocations/tool-result-renderer.tsx
   case 'newToolName':
     return <NewToolResult result={result} isReadonly={isReadonly} />;
   ```

3. **Import the new components** at the top of the renderer files.

### Adding New UI Variants

1. **Extend existing components** by adding new props:
   ```typescript
   interface MessageAvatarProps {
     role: 'user' | 'assistant';
     variant?: 'default' | 'compact' | 'large'; // New variant prop
   }
   ```

2. **Update component logic** to handle new variants:
   ```typescript
   const sizeClass = variant === 'compact' ? 'size-6' : 
                     variant === 'large' ? 'size-10' : 'size-8';
   ```

3. **Update type definitions** in `types.ts` if needed.

## Best Practices

1. **Single Responsibility**: Each component has one clear purpose
2. **Props Interface**: Use TypeScript interfaces for type safety
3. **Conditional Rendering**: Return null for components that shouldn't render
4. **Key Props**: Always provide unique keys for list items
5. **Error Boundaries**: Consider adding error boundaries for tool components
6. **Performance**: Use React.memo for expensive components
7. **Accessibility**: Maintain ARIA attributes and semantic HTML
8. **Testing**: Add data-testid attributes for testing

## Migration Guide

The refactored components maintain the same external API as the original `message.tsx`, so no changes are required in parent components. The `PreviewMessage` component continues to work exactly the same way.

## Performance Considerations

- **Memoization**: The main `PreviewMessage` component uses `React.memo` with custom comparison
- **Conditional Rendering**: Components return null early to avoid unnecessary renders
- **Key Optimization**: Unique keys prevent unnecessary re-renders of list items
- **Component Splitting**: Smaller components enable better tree-shaking and code splitting