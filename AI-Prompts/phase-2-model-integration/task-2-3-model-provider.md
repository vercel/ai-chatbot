# Task: Update Model Provider for LostMind AI

## Context
Following the integration of Gemini models (Task 2.1) and the model configuration enhancements (Task 2.2), this task focuses on updating the model provider system. The model provider handles the actual API interactions with both OpenAI and Google AI services, ensuring proper request formatting, error handling, and response processing.

## Objective
Create a unified model provider system that seamlessly handles requests to both OpenAI and Google AI endpoints, maintains consistent chat history formatting, and implements proper error handling and fallback mechanisms.

## Requirements
- Support both OpenAI and Google AI providers in a unified interface
- Implement proper middleware for consistent request/response handling
- Add LostMind branding to system prompts
- Create provider-specific error handling with graceful fallbacks
- Optimize streaming responses for both providers
- Support different feature sets (reasoning, vision) across providers
- Ensure proper token counting and rate limiting

## File Locations
- Primary: `/lib/providers/index.ts` - Main provider configuration
- Primary: `/lib/providers/openai.ts` - OpenAI specific provider
- Primary: `/lib/providers/google.ts` - Google AI specific provider
- Primary: `/app/api/chat/route.ts` - API route handler
- Reference: `/lib/hooks/use-chat.ts` - Client-side chat hook
- Reference: `/config/prompts.ts` - System prompts configuration

## Implementation Guidelines

### 1. Provider Interface
Create a unified provider interface in `/lib/providers/types.ts`:

```typescript
import { ModelConfig } from '@/types';

export interface ProviderResponse {
  text: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason?: string;
}

export interface ProviderRequest {
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  model: ModelConfig;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ModelProvider {
  id: string;
  name: string;
  generateText: (request: ProviderRequest) => Promise<ProviderResponse>;
  generateStream: (request: ProviderRequest) => AsyncGenerator<string>;
  countTokens: (text: string) => Promise<number>;
}
```

### 2. OpenAI Provider Implementation
Update or create the OpenAI provider in `/lib/providers/openai.ts`:

```typescript
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { ModelProvider, ProviderRequest, ProviderResponse } from './types';
import { env } from '@/lib/env';

export const openaiProvider: ModelProvider = {
  id: 'openai',
  name: 'LostMind AI (OpenAI)',
  
  generateText: async (request: ProviderRequest): Promise<ProviderResponse> => {
    try {
      // Add LostMind branding to system message
      const messages = request.messages.map(msg => {
        if (msg.role === 'system') {
          return {
            ...msg,
            content: `${msg.content}\n\nYou are LostMind AI, a neural-powered assistant built by the LostMind team.`
          };
        }
        return msg;
      });
      
      const response = await openai({
        apiKey: env.OPENAI_API_KEY,
        model: request.model.id,
        messages: messages,
        temperature: request.temperature || request.model.temperature,
        max_tokens: request.maxTokens || request.model.maxTokens,
      }).text();
      
      return {
        text: response,
        // Add token usage estimation if needed
      };
    } catch (error) {
      console.error('OpenAI provider error:', error);
      throw new Error(`OpenAI Error: ${error.message || 'Unknown error'}`);
    }
  },
  
  generateStream: async function* (request: ProviderRequest) {
    try {
      // Add LostMind branding to system message
      const messages = request.messages.map(msg => {
        if (msg.role === 'system') {
          return {
            ...msg,
            content: `${msg.content}\n\nYou are LostMind AI, a neural-powered assistant built by the LostMind team.`
          };
        }
        return msg;
      });
      
      const result = await streamText({
        api: openai({
          apiKey: env.OPENAI_API_KEY,
          model: request.model.id,
          messages: messages,
          temperature: request.temperature || request.model.temperature,
          max_tokens: request.maxTokens || request.model.maxTokens,
        })
      });
      
      for await (const chunk of result) {
        yield chunk;
      }
    } catch (error) {
      console.error('OpenAI stream error:', error);
      yield `I apologize, but I encountered an error. Please try again or select a different model.`;
    }
  },
  
  countTokens: async (text: string): Promise<number> => {
    // Implement token counting logic or use OpenAI's tokenizer
    // For simplicity, use rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
};
```

### 3. Google AI Provider Implementation
Create the Google AI provider in `/lib/providers/google.ts`:

```typescript
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { ModelProvider, ProviderRequest, ProviderResponse } from './types';
import { env } from '@/lib/env';

export const googleProvider: ModelProvider = {
  id: 'google',
  name: 'LostMind AI (Google)',
  
  generateText: async (request: ProviderRequest): Promise<ProviderResponse> => {
    try {
      // Add LostMind branding to system message
      const messages = request.messages.map(msg => {
        if (msg.role === 'system') {
          return {
            ...msg,
            content: `${msg.content}\n\nYou are LostMind AI, a neural-powered assistant built by the LostMind team.`
          };
        }
        return msg;
      });
      
      // Determine correct model ID based on request
      let modelId = request.model.id;
      if (request.model.name === 'LostMind Vision Pro' && request.model.isVision) {
        modelId = 'gemini-2.5-pro-vision';
      }
      
      const response = await google({
        apiKey: env.GEMINI_API_KEY,
        model: modelId,
        messages: messages,
        temperature: request.temperature || request.model.temperature,
        max_output_tokens: request.maxTokens || request.model.maxTokens,
      }).text();
      
      return {
        text: response,
        // Add token usage estimation if needed
      };
    } catch (error) {
      console.error('Google provider error:', error);
      throw new Error(`Google AI Error: ${error.message || 'Unknown error'}`);
    }
  },
  
  generateStream: async function* (request: ProviderRequest) {
    try {
      // Add LostMind branding to system message
      const messages = request.messages.map(msg => {
        if (msg.role === 'system') {
          return {
            ...msg,
            content: `${msg.content}\n\nYou are LostMind AI, a neural-powered assistant built by the LostMind team.`
          };
        }
        return msg;
      });
      
      // Determine correct model ID based on request
      let modelId = request.model.id;
      if (request.model.name === 'LostMind Vision Pro' && request.model.isVision) {
        modelId = 'gemini-2.5-pro-vision';
      }
      
      const result = await streamText({
        api: google({
          apiKey: env.GEMINI_API_KEY,
          model: modelId,
          messages: messages,
          temperature: request.temperature || request.model.temperature,
          max_output_tokens: request.maxTokens || request.model.maxTokens,
        })
      });
      
      for await (const chunk of result) {
        yield chunk;
      }
    } catch (error) {
      console.error('Google stream error:', error);
      yield `I apologize, but I encountered an error. Please try again or select a different model.`;
    }
  },
  
  countTokens: async (text: string): Promise<number> => {
    // Implement token counting logic or use Google's tokenizer
    // For simplicity, use rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
};
```

### 4. Unified Provider Factory
Create the provider factory in `/lib/providers/index.ts`:

```typescript
import { ModelProvider } from './types';
import { openaiProvider } from './openai';
import { googleProvider } from './google';
import { ModelConfig } from '@/types';

const providers: Record<string, ModelProvider> = {
  openai: openaiProvider,
  google: googleProvider,
};

export const getProvider = (model: ModelConfig): ModelProvider => {
  const provider = providers[model.provider];
  if (!provider) {
    throw new Error(`Provider not found for model: ${model.name}`);
  }
  return provider;
};

export const getProviders = () => providers;
```

### 5. System Prompts Configuration
Create branded system prompts in `/config/prompts.ts`:

```typescript
export const systemPrompts = {
  default: `You are LostMind AI, a helpful neural-powered assistant. 
Provide accurate, informative and friendly responses.`,

  reasoning: `You are LostMind Quantum, an advanced reasoning model.
Approach problems step-by-step, considering multiple perspectives.
Break down complex questions and provide detailed, thoughtful analysis.`,

  vision: `You are LostMind Vision Pro, a multimodal AI assistant.
Analyze visual content accurately and provide helpful descriptions and insights.
When working with images, be thorough but concise in your observations.`,
};

export const getSystemPrompt = (modelName: string) => {
  if (modelName.includes('Quantum')) return systemPrompts.reasoning;
  if (modelName.includes('Vision')) return systemPrompts.vision;
  return systemPrompts.default;
};
```

## Expected Outcome
- A unified provider system that handles both OpenAI and Google models
- Consistent request/response formatting across providers
- LostMind branding in system prompts
- Proper error handling with informative messages
- Optimized streaming for real-time responses
- Support for special model capabilities (reasoning, vision)

## Verification Steps
1. Test chat functionality with OpenAI models (LostMind Lite and Pro)
2. Test chat functionality with Google models (Quantum, Vision, Flash)
3. Verify error handling by temporarily using invalid API keys
4. Check that stream responses work properly for both providers
5. Confirm that proper system prompts are used for each model type

## Related Documentation
- AI SDK Documentation: https://sdk.vercel.ai/docs/api-reference
- OpenAI API Reference: https://platform.openai.com/docs/api-reference
- Google AI API Reference: https://ai.google.dev/api/rest
- NextJS API Routes: https://nextjs.org/docs/api-routes/introduction
