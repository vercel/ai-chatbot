# XAI (Grok) Model Usage Guideline for LostMind AI Chatbot

**Last Updated**: 2025-05-12

## Objective
This document provides the definitive guide for integrating and using Xai's Grok models within the LostMind AI Chatbot project. All AI agent prompts and manual development efforts related to Grok models **must** adhere to these guidelines to ensure consistency and the use of the latest appropriate model versions.

## Approved Model Identifiers

Based on the latest official xAI documentation (as of May 12, 2025), the following model identifiers **should** be used:

* **For Grok-2 (Latest version):**
  ```
  grok-2-vision-1212  // Latest vision-enabled model
  grok-2-1212         // Latest text-only model
  ```

* **For Grok-3 (Mini variant):**
  ```
  grok-3-mini-beta    // Latest mini model with reasoning capabilities
  ```

**Rationale:** The Grok models are integrated through the official `@ai-sdk/xai` package provided by Vercel AI SDK. These identifiers represent the most current and stable versions available through the SDK integration.

## Model Specifications & Capabilities

| Specification | Grok-2 | Grok-3-Mini |
|---------------|--------|-------------|
| Context Window | 128K tokens | 32K tokens |
| Input Types | Text, Code, Images (vision model) | Text, Code |
| Output Types | Text, Code, JSON | Text, Code, JSON |
| Max Input Tokens | 131,072 | 32,768 |
| Max Output Tokens | 8,192 | 4,096 |
| Multimodal Support | Yes (vision model) | No |
| Special Features | Web browsing, Thinking middleware | Reasoning, Thinking middleware |
| Response Speed | Standard | Fast |

## Implementation with Vercel AI SDK

The official integration pattern using the Vercel AI SDK's `@ai-sdk/xai` package is the recommended approach for Grok models. This approach is already implemented in the current project.

### Current Implementation

The `/lib/ai/providers.ts` file currently initializes and exports Grok model instances:

```typescript
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': xai('grok-2-vision-1212'),
        'chat-model-reasoning': wrapLanguageModel({
          model: xai('grok-3-mini-beta'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': xai('grok-2-1212'),
        'artifact-model': xai('grok-2-1212'),
      },
      imageModels: {
        'small-model': xai.image('grok-2-image'),
      },
    });
```

### Recommended Enhancement for Multi-Provider Support

When implementing Gemini models alongside Grok models, the providers configuration should be structured to support both providers:

```typescript
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { google } from '@ai-sdk/google';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

// Grok models configuration
export const xaiProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        // Test environment models
        'grok-chat': chatModel,
        'grok-reasoning': reasoningModel,
        'grok-title': titleModel,
        'grok-artifact': artifactModel,
      }
    })
  : customProvider({
      languageModels: {
        // Production Grok models
        'grok-chat': xai('grok-2-vision-1212'),
        'grok-reasoning': wrapLanguageModel({
          model: xai('grok-3-mini-beta'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'grok-title': xai('grok-2-1212'),
        'grok-artifact': xai('grok-2-1212'),
      },
      imageModels: {
        'grok-image': xai.image('grok-2-image'),
      },
    });

// Gemini models configuration
export const googleProvider = customProvider({
  languageModels: {
    'gemini-quantum': wrapLanguageModel({
      model: google('gemini-2.5-pro-preview-05-06'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'gemini-vision': google('gemini-2.5-pro-preview-05-06'),
    'gemini-flash': google('gemini-2.5-flash-preview'),
  },
});

// Combined provider for easy model access
export const combinedProvider = {
  ...xaiProvider,
  ...googleProvider
};
```

## Authentication Requirements

The `@ai-sdk/xai` package handles authentication through the following environment variable:

```
XAI_API_KEY=your_xai_api_key_here
```

To obtain an XAI API key:
1. Sign up for access at [Grok's official website](https://grok.x.ai/)
2. Request API access through your account dashboard
3. Store the API key securely in your environment variables

## Required Environment Variables

- `XAI_API_KEY`: Your XAI API key for accessing Grok models
- `XAI_MODEL_OVERRIDE`: (Optional) Override for specific model versions if needed

## Best Practices for Production Use

### Performance Optimization
- Use streaming responses for chat interfaces to improve perceived latency
- Set appropriate generation parameters based on your use case
- Consider implementing caching for common queries to reduce API usage
- Implement timeout handling for long-running requests

### Error Handling
- Implement robust error handling for API errors, rate limits, and service unavailability
- Consider implementing automatic retry logic with exponential backoff for transient errors
- Always gracefully degrade the user experience when model errors occur
- Implement logging for all model interactions to facilitate debugging

### Cost Management
- Implement rate limiting in your application to prevent unexpected spikes in usage
- Consider using the mini variant for less complex tasks to reduce token usage
- Keep track of token usage per request to understand costs

### Security Considerations
- Never expose your API keys in client-side code
- Implement input validation to prevent prompt injection attacks
- Consider adding content filtering for user inputs
- Use system instructions to improve model safety and reliability

## Model Selection Guidelines

When choosing between Grok and Gemini models for specific tasks:

1. **Use Grok-2-Vision for**:
   - Visual understanding tasks
   - Complex multimodal interactions
   - Tasks requiring web search capabilities
   - General chat functionality

2. **Use Grok-3-Mini-Beta for**:
   - Reasoning-focused tasks
   - Faster response times
   - When smaller context windows are sufficient

3. **Use Gemini models for**:
   - Specialized tasks benefiting from Gemini's training
   - When Grok models are unavailable or rate-limited
   - To provide model diversity and fallback options

## Integration with Gemini Models

When integrating Grok models alongside Gemini models, the following approach is recommended:

1. **Consistent Interface**: Maintain a consistent interface for both model providers
2. **Provider Selection**: Allow easy switching between providers
3. **Fallback Chain**: Implement fallback chains across providers (Grok → Gemini or vice versa)
4. **Context Preservation**: Ensure chat context is preserved when switching between models
5. **UI Grouping**: Group models by provider in the UI for clarity

## Latest Vercel AI SDK Integration

The latest Vercel AI SDK (v4.3.13+) supports XAI models through the `@ai-sdk/xai` package. Make sure to keep this dependency up to date to access the latest features and improvements:

```bash
pnpm update @ai-sdk/xai@latest
```

## Usage in Prompts

All AI agent prompts that involve modifying or using Grok models must:
1. Reference this document (`docs/technical_guidelines/xai_model_usage.md`)
2. Ensure any example code or instructions strictly use the model identifiers specified herein
3. Include proper error handling and authentication setup
4. Consider the integration with other model providers as described in this guide

## Review and Updates

This document should be reviewed whenever xAI releases new versions of Grok models or when the Vercel AI SDK receives significant updates for XAI integration.

Stay informed about new model versions through:
- [x.ai](https://x.ai/) announcements
- [Vercel AI SDK documentation](https://sdk.vercel.ai/docs)
- [x.ai developer portal](https://platform.x.ai/)