# Plan to Update Model Selector for Dynamic OpenRouter Models

## Objective

Update the model selector on the main chat page to dynamically fetch and display all available models from the OpenRouter API, allowing users to select any model. Maintain static fallback, add loading/error states, and ensure compatibility with existing cookie persistence and getModel function. Filter for chat/instruct models where possible (based on OpenRouter's model tags or names).

## Current State

- **lib/ai/models.ts**: Hardcoded `chatModels` array (Gemini, Llama, Mistral) with `ChatModel` interface (id, name, description). OpenRouter provider setup.
- **components/model-selector.tsx**: Client component using DropdownMenu from shadcn/ui. Uses `chatModels`, sets selectedModel state, calls `handleModelChange` which refreshes router but TODO for cookie. Active model displayed with name/description.
- **app/(chat)/page.tsx**: Passes initialModel from cookie or DEFAULT_CHAT_MODEL to ModelSelector.
- **app/(chat)/actions.ts**: `saveChatModelAsCookie` action sets cookie.
- **lib/ai/get-model.ts**: Uses modelId from env or param, calls openrouter(modelId).

No Redis; use SWR for client caching or Next.js revalidate for server.

## High-Level Steps

1. **Create API Route for Fetching Models**: Server-side /app/api/models/route.ts to fetch from OpenRouter API securely (no client exposure of API key).
2. **Update ModelSelector**: Make dynamic with fetch to API, SWR for caching/loading, fallback to static list. Filter models (e.g., include those with 'chat' or 'instruct' in id).
3. **Integrate in Chat Page**: Fetch or pass models as prop if server-rendered.
4. **Handle Selection**: On change, call saveChatModelAsCookie action, refresh chat if needed.
5. **Compatibility**: Ensure selected model works with getModel (OpenRouter supports all listed models).
6. **Testing**: Add fallback, error toast, persist selection.
7. **Documentation**: Update README with new feature.

## Detailed Implementation

### 1. API Route: app/api/models/route.ts

Create GET handler to fetch models from OpenRouter.

```ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    const data = await response.json();
    const models = data.data
      .filter((model: any) => model.id.includes('chat') || model.id.includes('instruct')) // Filter for chat-capable
      .map((model: any) => ({
        id: model.id,
        name: model.name || model.id.split('/').pop(),
        description: model.description || 'OpenRouter model',
      })) as ChatModel[];

    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ models: [] }, { status: 500 });
  }
}
```

- Env: Ensure OPENROUTER_API_KEY set.
- No caching here; handle in client SWR.
- Fallback: If error, client uses static.

### 2. Update lib/ai/models.ts

Add export for static fallback.

```ts
// Existing code...

export const getStaticModels = (): ChatModel[] => chatModels; // For fallback
```

### 3. Update ModelSelector (components/model-selector.tsx)

Use SWR to fetch from /api/models, loading state, fallback to static.

First, install SWR if not (but it is in package.json).

```tsx
'use client';

import * as React from 'react';
import useSWR from 'swr';
import { usePathname, useRouter } from 'next/navigation';
import { type ChatModel, getStaticModels } from '@/lib/ai/models';
// ... existing imports

interface ModelSelectorProps extends React.ComponentProps<'div'> {
  initialModel: string;
}

export function ModelSelector({ initialModel, ...props }: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = React.useState<string>(initialModel);
  const router = useRouter();
  const pathname = usePathname();

  const { data: dynamicModels, error, isLoading } = useSWR<ChatModel[]>('/api/models', async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch');
    const { models } = await res.json();
    return models;
  }, {
    fallbackData: [], // Initial empty
    revalidateOnFocus: false,
    revalidateIfStale: false, // Cache for session
  });

  const models = dynamicModels.length > 0 ? dynamicModels : getStaticModels();
  const activeModel = models.find(model => model.id === selectedModel);

  if (isLoading && dynamicModels.length === 0) {
    return <div className="text-muted-foreground">Loading models...</div>; // Or spinner
  }

  if (error) {
    // Toast error if needed
    console.error('Model fetch error:', error);
  }

  const handleModelChange = async (modelId: string) => {
    setSelectedModel(modelId);
    // Call action to save cookie
    await fetch('/api/chat/save-model', {
      method: 'POST',
      body: JSON.stringify({ model: modelId }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (pathname === '/') {
      router.refresh();
    }
  };

  return (
    <div {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start" disabled={isLoading}>
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col items-start">
                <span className="font-medium">{activeModel?.name || 'Select Model'}</span>
                <span className="text-xs text-muted-foreground">
                  {activeModel?.description || (isLoading ? 'Loading...' : 'Static fallback')}
                </span>
              </div>
              <ChevronDownIcon size={16} />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80">
          <DropdownMenuLabel>Select a model</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={selectedModel}
            onValueChange={handleModelChange}
          >
            {models.map((model: ChatModel) => (
              <DropdownMenuRadioItem key={model.id} value={model.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {model.description}
                  </span>
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

- SWR caches response, revalidates on mount if stale.
- Fallback: If dynamic empty, use static.
- Disabled during loading.

### 4. Update Actions for Cookie Save

In app/(chat)/actions.ts, existing saveChatModelAsCookie is server action; call it from client via fetch or useActionState.

For simplicity, create /app/api/chat/save-model/route.ts POST handler.

```ts
import { NextRequest, NextResponse } from 'next/server';
import { saveChatModelAsCookie } from '../actions';

export async function POST(request: NextRequest) {
  const { model } = await request.json();
  await saveChatModelAsCookie(model);
  return NextResponse.json({ success: true });
}
```

### 5. Integrate in app/(chat)/page.tsx

ModelSelector already fetches independently. If server-rendered list needed, fetch in page and pass as prop.

For now, client fetch is fine (RSC compatible).

### 6. Compatibility with getModel

getModel uses modelId directly with openrouter(modelId), which supports all OpenRouter models. No changes needed; selection passes id to chat transport/actions.

### 7. Testing

- Static: Disable API key, verify fallback.
- Dynamic: Mock fetch, check list, selection updates cookie, chat uses new model.
- Error: Simulate 500, fallback works.
- Persistence: Select model, reload, selected in dropdown/cookie used.
- Add E2E test: playwright test for selector change.

### 8. Edge Cases

- No API key: Fallback static.
- Empty response: Fallback.
- Large list: Paginate dropdown if >50 models (add search).
- Filter: Client-side filter for 'chat' in id if too many.

## Next Steps

Implement code changes in code mode. Add to project-review.md under improvements.
