# Task: Configure Gemini Models for LostMind AI

## Context
LostMind AI is migrating from a standard Vercel AI chatbot to a branded experience featuring 5 AI models. This task focuses on integrating Gemini 2.5 Pro and Gemini 2.5 Flash models using the latest AI SDK v4.3.13 patterns. Phase 1 (core rebranding) is already complete, and we're now beginning Phase 2 (model integration).

## Task Tracking Instructions
1. Begin by updating the task status in `/Tasks/task-tracker.md`:
   - Change task 2.1 status from "PENDING" to "IN_PROGRESS"
   - Add the current timestamp to the "Start Time" column in ISO format (YYYY-MM-DD HH:MM:SS)

2. Update the task file in `/Tasks/phase-2/task-2-1-gemini-models.md`:
   - Add start time
   - Check off requirements as you complete them
   - Document implementation notes

3. After completion:
   - Record completion time in both task file and task-tracker.md
   - Calculate and document total time spent
   - Update task status to "COMPLETED" in task-tracker.md
   - Move task file to `/Tasks/completed/` folder
   - Update the "Current Task" section in task-tracker.md to point to the next task

## Objective
Add the Gemini 2.5 Pro and Gemini 2.5 Flash models to the existing model provider configuration, applying LostMind brand names and ensuring proper integration with the AI SDK.

## Requirements
- Use AI SDK v4.3.13+ and `@ai-sdk/google` for Gemini integration
- Add 2 Gemini models to the existing 3 OpenAI models:
  - Gemini 2.5 Pro → LostMind Quantum (reasoning model) and LostMind Vision Pro
  - Gemini 2.5 Flash → LostMind Flash
- Configure with Gemini API Key: `AIzaSyBEvAcYruaw8VTME1krWcu76sz6IEB5hAk`
- Use appropriate model parameters:
  - Temperature: 0.7 for creative tasks, 0.2 for reasoning/factual tasks
  - Max tokens: 4096 for standard, 8192 for long-form content
- Ensure proper error handling with fallback options
- Maintain type safety throughout implementation

## File Locations
- Primary: `/app/api/chat/route.ts` - Update OpenAI handler to support Gemini
- Primary: `/lib/models.ts` - Add model definitions and configurations
- Primary: `/lib/providers/index.ts` - Update provider configuration
- Reference: `/lib/hooks/use-chat.ts` - How models are used
- Reference: `/components/model-selector.tsx` - UI for model selection

## Implementation Guidelines

### 1. Model Definition Structure
Follow this pattern for defining models in `/lib/models.ts`:

```typescript
import { ModelConfig } from '@/types';

export const models: ModelConfig[] = [
  // Existing models (maintain these)
  {
    id: 'gpt-4o-mini',
    name: 'LostMind Lite',
    description: 'Fast responses for everyday queries',
    provider: 'openai',
    logoPath: '/logos/lostmind-lite.svg', // Create this SVG based on branding
    maxTokens: 4096,
    temperature: 0.7,
    capabilities: ['chat', 'reasoning'],
  },
  // ... other OpenAI models
  
  // New Gemini models
  {
    id: 'gemini-2.5-pro',
    name: 'LostMind Quantum',
    description: 'Advanced reasoning model for complex problems',
    provider: 'google',
    logoPath: '/logos/lostmind-quantum.svg', // Create this SVG
    maxTokens: 8192,
    temperature: 0.2,
    capabilities: ['chat', 'reasoning', 'knowledge', 'coding'],
    isDefault: false,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'LostMind Vision Pro',
    description: 'Multimodal AI with vision capabilities',
    provider: 'google',
    logoPath: '/logos/lostmind-vision.svg', // Create this SVG
    maxTokens: 8192,
    temperature: 0.7,
    capabilities: ['chat', 'vision', 'reasoning'],
    isDefault: false,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'LostMind Flash',
    description: 'Ultra-fast responses with high efficiency',
    provider: 'google',
    logoPath: '/logos/lostmind-flash.svg', // Create this SVG
    maxTokens: 4096,
    temperature: 0.7,
    capabilities: ['chat'],
    isDefault: false,
  },
];
```

### 2. Provider Configuration
Update `/lib/providers/index.ts` to include Google provider:

```typescript
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { customProvider } from 'ai/rsc';

export const providers = {
  openai: customProvider({
    languageModels: {
      'gpt-4o': openai('gpt-4o'),
      'gpt-4o-mini': openai('gpt-4o-mini'),
      // other OpenAI models
    },
  }),
  google: customProvider({
    languageModels: {
      'gemini-2.5-pro': google('gemini-2.5-pro-preview-05-06'),
      'gemini-2.5-flash': google('gemini-2.5-flash-preview-05-06'),
    },
  }),
};
```

### 3. Environment Setup
Ensure the environment variables are properly configured in `.env.local`:

```
# OpenAI API Key (existing)
OPENAI_API_KEY=your_openai_key

# Gemini API Key
GEMINI_API_KEY=AIzaSyBEvAcYruaw8VTME1krWcu76sz6IEB5hAk
```

### 4. Package Dependencies
Make sure to install the required Google AI SDK package:

```bash
pnpm add @ai-sdk/google@latest
```

### 5. Error Handling
Implement proper error handling for both providers:

```typescript
try {
  // Provider-specific code
} catch (error) {
  console.error('Model error:', error);
  return new Response(JSON.stringify({
    error: 'There was an error with the AI model. Please try again or select a different model.'
  }), {
    status: 500,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
```

## Expected Outcome
- Gemini models appear in the model selector UI with LostMind branding
- All 5 models (3 OpenAI + 2 Gemini) function properly
- Error handling gracefully manages API issues
- Model capabilities are properly configured
- TypeScript types are maintained throughout implementation

## Verification Steps
1. Run the application locally with `pnpm dev`
2. Test each model in the chat interface
3. Verify proper error handling by temporarily using an invalid API key
4. Check that model selection properly switches between providers
5. Ensure branding is consistent across all model references

## Related Documentation
- AI SDK Google Integration: https://sdk.vercel.ai/docs/api-reference/google
- Gemini API Reference: https://ai.google.dev/api/rest/v1beta
- Project Bible: See "Model Branding" section
- Task Tracker: `/Tasks/task-tracker.md`