# AI Tools Development Guide

This guide provides comprehensive instructions for adding new AI tools to the chatbot application, including prompts, UI components, and integration patterns.

## Table of Contents

1. [Overview](#overview)
2. [AI Tool Architecture](#ai-tool-architecture)
3. [Creating a New AI Tool](#creating-a-new-ai-tool)
4. [Updating Prompts](#updating-prompts)
5. [Creating UI Components](#creating-ui-components)
6. [Integration Checklist](#integration-checklist)
7. [Examples](#examples)
8. [Testing Guidelines](#testing-guidelines)

## Overview

The AI chatbot uses a tool-based architecture where the AI model can invoke specific functions to perform tasks like weather fetching, document creation, chart generation, and more. Each tool consists of:

- **Tool Definition**: The actual function with parameters and execution logic
- **Prompt Integration**: Instructions for the AI on when and how to use the tool
- **UI Components**: React components to display tool calls and results
- **Route Integration**: Registration of the tool in the chat API

## AI Tool Architecture

### File Structure
```
lib/ai/tools/           # Tool definitions
├── get-weather.ts      # Weather fetching tool
├── get-chart.ts        # Chart generation tool
├── create-document.ts  # Document creation tool
└── ...

lib/ai/prompts.ts       # AI prompts and instructions

components/             # UI components for tool rendering
├── weather.tsx         # Weather display component
├── chart.tsx           # Chart display component
├── message.tsx         # Main message component (handles all tools)
└── ...

app/(chat)/api/chat/route.ts  # Tool registration and API integration
```

### Tool States

Each AI tool goes through these states:
1. **Call**: AI decides to invoke the tool (shows loading UI)
2. **Result**: Tool execution completes (shows result UI)
3. **Error**: Tool execution fails (shows error UI)

## Creating a New AI Tool

### Step 1: Create the Tool Definition

Create a new file in `lib/ai/tools/your-tool-name.ts`:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

export const yourToolName = tool({
  description: 'Brief description of what this tool does',
  parameters: z.object({
    // Define your parameters with Zod schema
    param1: z.string().describe('Description of parameter 1'),
    param2: z.number().optional().describe('Optional parameter 2'),
    complexParam: z.object({
      subParam: z.string(),
      // Nested parameters are supported
    }).describe('Complex parameter description'),
  }),
  execute: async ({ param1, param2, complexParam }) => {
    try {
      // Your tool logic here
      const result = await someAsyncOperation(param1);
      
      return {
        success: true,
        data: result,
        // Return structured data that your UI component can consume
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
```

### Step 2: Register the Tool

Update `app/(chat)/api/chat/route.ts`:

```typescript
// Add import
import { yourToolName } from '@/lib/ai/tools/your-tool-name';

// Add to experimental_activeTools array
experimental_activeTools:
  selectedChatModel === 'chat-model-reasoning'
    ? []
    : [
        'getWeather',
        'getChart',
        'yourToolName',  // Add here
        // ... other tools
      ],

// Add to tools object
tools: {
  getWeather,
  getChart,
  yourToolName,  // Add here
  // ... other tools
},
```

### Step 3: Create UI Component

Create `components/your-component-name.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface YourComponentProps {
  args?: {
    // Parameters passed to the tool
    param1?: string;
    param2?: number;
  };
  result?: {
    // Result structure from your tool
    success: boolean;
    data?: any;
    error?: string;
  };
}

export function YourComponent({ args, result }: YourComponentProps) {
  // Loading state (when tool is being called)
  if (!result) {
    return (
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 bg-blue-500 rounded animate-pulse" />
          <div className="text-sm font-medium">Processing...</div>
        </div>
        <div className="w-full h-32 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  // Error state
  if (!result.success || result.error) {
    return (
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-red-500 rounded" />
          <div className="text-sm font-medium text-red-800">Error</div>
        </div>
        <p className="text-sm text-red-600">{result.error}</p>
      </div>
    );
  }

  // Success state
  return (
    <div className="border rounded-lg p-4 bg-background">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 bg-green-500 rounded" />
        <div className="text-sm font-medium">Success</div>
      </div>
      
      {/* Your result rendering here */}
      <div>
        {/* Display result.data */}
      </div>
    </div>
  );
}
```

### Step 4: Integrate UI Component

Update `components/message.tsx`:

```typescript
// Add import
import { YourComponent } from './your-component-name';

// Add to skeleton loading condition
className={cx({
  skeleton: ['getWeather', 'getChart', 'yourToolName'].includes(toolName),
})}

// Add to call state rendering
{toolName === 'getWeather' ? (
  <Weather />
) : toolName === 'getChart' ? (
  <Chart args={args} />
) : toolName === 'yourToolName' ? (
  <YourComponent args={args} />
) : // ... other tools

// Add to result state rendering
{toolName === 'getWeather' ? (
  <Weather weatherAtLocation={result} />
) : toolName === 'getChart' ? (
  <Chart result={result} />
) : toolName === 'yourToolName' ? (
  <YourComponent result={result} />
) : // ... other tools
```

## Updating Prompts

### Adding Tool-Specific Prompts

Update `lib/ai/prompts.ts`:

```typescript
export const yourToolPrompt = `
You have access to [tool name] that can [brief description]. When users request [use cases], you can:

**Capabilities:**
- Capability 1
- Capability 2
- Capability 3

**Usage Guidelines:**
1. Use the tool when [condition 1]
2. Always [requirement 1]
3. Include [requirement 2]

**When to use:**
- [Use case 1]
- [Use case 2]
- [Use case 3]

Ensure [important considerations].
`;

// Add to system prompt
export const systemPrompt = ({
  selectedChatModel,
  requestHints,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
}) => {
  const requestPrompt = getRequestPromptFromHints(requestHints);

  if (selectedChatModel === 'chat-model-reasoning') {
    return `${regularPrompt}\n\n${requestPrompt}`;
  } else {
    return `${regularPrompt}\n\n${requestPrompt}\n\n${artifactsPrompt}\n\n${chartPrompt}\n\n${yourToolPrompt}`;
  }
};
```

### Prompt Best Practices

1. **Be Specific**: Clearly define when the tool should be used
2. **Include Examples**: Show expected input/output patterns
3. **Set Boundaries**: Define what the tool can and cannot do
4. **Error Handling**: Explain how errors should be communicated
5. **Context Awareness**: Consider how the tool fits with other features

## Creating UI Components

### Component Design Principles

1. **Consistent States**: Always handle loading, success, and error states
2. **Accessibility**: Use proper ARIA labels and semantic HTML
3. **Responsive Design**: Ensure components work on all screen sizes
4. **Theme Compatibility**: Use theme-aware colors and styling
5. **Performance**: Optimize for fast rendering and minimal re-renders

### Common Patterns

#### Loading State
```typescript
if (!result) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 bg-blue-500 rounded animate-pulse" />
        <div className="text-sm font-medium">Loading message...</div>
      </div>
      <div className="skeleton-content" />
    </div>
  );
}
```

#### Error State
```typescript
if (!result.success || result.error) {
  return (
    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 bg-red-500 rounded" />
        <div className="text-sm font-medium text-red-800">Error Title</div>
      </div>
      <p className="text-sm text-red-600">{result.error}</p>
    </div>
  );
}
```

#### Success State
```typescript
return (
  <div className="border rounded-lg p-4 bg-background">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-4 h-4 bg-green-500 rounded" />
      <div className="text-sm font-medium">Success Title</div>
    </div>
    {/* Content here */}
  </div>
);
```

## Integration Checklist

When adding a new AI tool, ensure you complete all these steps:

### Backend Integration
- [ ] Create tool definition in `lib/ai/tools/`
- [ ] Add tool import to `app/(chat)/api/chat/route.ts`
- [ ] Add tool name to `experimental_activeTools` array
- [ ] Add tool instance to `tools` object
- [ ] Test tool execution in isolation

### Frontend Integration
- [ ] Create UI component in `components/`
- [ ] Add component import to `components/message.tsx`
- [ ] Add tool name to skeleton loading condition  
- [ ] Add call state rendering
- [ ] Add result state rendering
- [ ] Test all component states (loading, success, error)

### Prompt Integration
- [ ] Create tool-specific prompt in `lib/ai/prompts.ts`
- [ ] Add prompt to system prompt composition
- [ ] Test AI understands when to use the tool
- [ ] Verify prompt clarity and specificity

### Documentation & Testing
- [ ] Add tool documentation
- [ ] Create unit tests for tool logic
- [ ] Create component tests for UI states
- [ ] Add integration tests for full workflow
- [ ] Update this guide if needed

## Examples

### Simple Data Fetching Tool

```typescript
// lib/ai/tools/get-stock-price.ts
export const getStockPrice = tool({
  description: 'Get current stock price for a given ticker symbol',
  parameters: z.object({
    symbol: z.string().describe('Stock ticker symbol (e.g., AAPL, GOOGL)'),
  }),
  execute: async ({ symbol }) => {
    try {
      const response = await fetch(`https://api.example.com/stock/${symbol}`);
      const data = await response.json();
      
      return {
        success: true,
        price: data.price,
        change: data.change,
        symbol: symbol.toUpperCase(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch stock price for ${symbol}`,
      };
    }
  },
});
```

### Complex Processing Tool

```typescript
// lib/ai/tools/analyze-data.ts
export const analyzeData = tool({
  description: 'Analyze uploaded data and provide insights',
  parameters: z.object({
    data: z.array(z.object({
      name: z.string(),
      value: z.number(),
    })).describe('Array of data points to analyze'),
    analysisType: z.enum(['trend', 'correlation', 'summary']).describe('Type of analysis to perform'),
  }),
  execute: async ({ data, analysisType }) => {
    try {
      // Complex data processing logic
      const insights = performAnalysis(data, analysisType);
      
      return {
        success: true,
        analysisType,
        insights,
        dataPoints: data.length,
        summary: generateSummary(insights),
      };
    } catch (error) {
      return {
        success: false,
        error: `Analysis failed: ${error.message}`,
      };
    }
  },
});
```

## Testing Guidelines

### Tool Testing
```typescript
// __tests__/tools/your-tool.test.ts
import { yourToolName } from '@/lib/ai/tools/your-tool-name';

describe('yourToolName', () => {
  it('should handle valid input', async () => {
    const result = await yourToolName.execute({
      param1: 'test-value',
    });
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    const result = await yourToolName.execute({
      param1: 'invalid-value',
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### Component Testing
```typescript
// __tests__/components/your-component.test.tsx
import { render, screen } from '@testing-library/react';
import { YourComponent } from '@/components/your-component';

describe('YourComponent', () => {
  it('shows loading state', () => {
    render(<YourComponent />);
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('shows success state', () => {
    render(<YourComponent result={{ success: true, data: 'test' }} />);
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<YourComponent result={{ success: false, error: 'Test error' }} />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Common Issues

1. **Tool not appearing in chat**: Check tool registration in route.ts
2. **UI not rendering**: Verify component integration in message.tsx
3. **AI not using tool**: Review prompt clarity and examples
4. **TypeScript errors**: Check parameter and result type definitions
5. **Loading states not working**: Ensure skeleton class is added

### Debug Tips

1. **Console logging**: Add logs in tool execution for debugging
2. **Network inspection**: Check API calls in browser dev tools
3. **State inspection**: Use React dev tools to inspect component props
4. **Prompt testing**: Test prompts in isolation before integration

---

This guide provides a comprehensive framework for extending the AI chatbot with new tools. Always follow the established patterns and maintain consistency with existing implementations.