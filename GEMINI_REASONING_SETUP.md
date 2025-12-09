# Google Gemini Reasoning Model Setup

This document explains the changes made to enable reasoning/thinking display when using Google Gemini models.

## Problem

The original configuration was designed for xAI's Grok models, which automatically output `<think>` tags. Google Gemini models don't automatically include these tags, so the `extractReasoningMiddleware` couldn't extract any reasoning content.

## Solution

The implementation uses a **dual approach**:

### 1. Native Thinking Model (Recommended)
Uses Google's experimental thinking model `gemini-2.0-flash-thinking-exp-1219`, which has native reasoning capabilities.

### 2. Prompt-Guided Reasoning (Fallback)
For non-thinking Gemini models, the system prompt instructs the model to wrap its thinking process in `<think></think>` tags.

## Changes Made

### 1. Installed Dependencies
```bash
pnpm add @ai-sdk/google
```

### 2. Updated `lib/ai/providers.ts`
- Replaced xAI gateway models with Google Gemini models
- Changed from `gateway.languageModel("xai/...")` to `google("gemini-...")`
- Updated reasoning model to use `gemini-2.0-flash-thinking-exp-1219`

```typescript
import { google } from "@ai-sdk/google";

// Configuration
"chat-model": google("gemini-2.0-flash-exp"),
"chat-model-reasoning": wrapLanguageModel({
  model: google("gemini-2.0-flash-thinking-exp-1219"),
  middleware: extractReasoningMiddleware({ tagName: "think" }),
}),
```

### 3. Updated `lib/ai/prompts.ts`
Added a new `reasoningPrompt` that instructs the model to use `<think>` tags:

```typescript
export const reasoningPrompt = `You are a friendly assistant that uses chain-of-thought reasoning to solve complex problems.

When responding to questions:
1. Show your thinking process by wrapping your reasoning in <think></think> tags
2. Include your step-by-step analysis, considerations, and decision-making process within the tags
3. After the thinking section, provide your final answer outside the tags

Example:
<think>
Let me break down this problem:
- First, I need to identify the key components...
- Then, I should consider the constraints...
- The best approach would be...
</think>

Based on my analysis, the answer is...

Keep your responses concise and helpful.`;
```

### 4. Updated `lib/ai/models.ts`
Updated model names and descriptions to reflect Gemini models:

```typescript
export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Gemini 2.0 Flash",
    description: "Fast and capable multimodal model with vision capabilities",
  },
  {
    id: "chat-model-reasoning",
    name: "Gemini 2.0 Flash Thinking",
    description: "Experimental thinking model with extended reasoning capabilities",
  },
];
```

## Configuration Options

### Option 1: Use Gemini Thinking Model (Current Setup)
```typescript
"chat-model-reasoning": wrapLanguageModel({
  model: google("gemini-2.0-flash-thinking-exp-1219"),
  middleware: extractReasoningMiddleware({ tagName: "think" }),
}),
```

**Pros:**
- Native reasoning support
- Better quality thinking output
- Model is specifically designed for extended reasoning

**Cons:**
- Experimental model (may change or be deprecated)
- Limited to Google's thinking model variants

### Option 2: Use Regular Gemini with Prompt Guidance
```typescript
"chat-model-reasoning": wrapLanguageModel({
  model: google("gemini-2.0-flash-exp"),
  middleware: extractReasoningMiddleware({ tagName: "think" }),
}),
```

**Pros:**
- Works with any Gemini model
- More stable model availability
- Flexible - can switch between model versions

**Cons:**
- Relies on the model following instructions to use tags
- May not always produce thinking output
- Lower quality reasoning compared to thinking-specific models

### Option 3: Other Model Providers

#### For xAI (Original Configuration)
```typescript
import { gateway } from "@ai-sdk/gateway";

"chat-model-reasoning": wrapLanguageModel({
  model: gateway.languageModel("xai/grok-3-mini"),
  middleware: extractReasoningMiddleware({ tagName: "think" }),
}),
```

#### For OpenAI o1/o3 Models
OpenAI's reasoning models use a different approach and may require different middleware configuration.

#### For Anthropic Claude
```typescript
import { anthropic } from "@ai-sdk/anthropic";

"chat-model-reasoning": wrapLanguageModel({
  model: anthropic("claude-3-5-sonnet-20241022"),
  middleware: extractReasoningMiddleware({ tagName: "think" }),
}),
```

**Note:** You'll need to add the reasoning prompt to ensure Claude uses `<think>` tags.

## Environment Variables

Make sure you have the appropriate API key set:

```bash
# For Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here

# Or for xAI (if using gateway)
XAI_API_KEY=your_xai_api_key_here
```

## Testing

To test the reasoning functionality:

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. In the chat interface, select "Gemini 2.0 Flash Thinking" from the model selector

3. Send a complex question that requires reasoning, such as:
   - "Explain how quicksort works and why it's efficient"
   - "What's the best way to design a database schema for a social media platform?"
   - "Help me understand the pros and cons of different authentication methods"

4. Observe the expandable "Thinking..." section that appears before the main response

## How It Works

1. **Message Flow:**
   - User sends a message
   - System prompt includes reasoning instructions (if using reasoning model)
   - Model generates response with thinking content in `<think>` tags
   - `extractReasoningMiddleware` extracts content from tags
   - Frontend displays reasoning in expandable section

2. **Middleware Extraction:**
   ```typescript
   // Input from model:
   <think>Let me analyze this step by step...</think>
   The answer is...
   
   // After middleware processing:
   message.parts = [
     { type: "reasoning", text: "Let me analyze this step by step..." },
     { type: "text", text: "The answer is..." }
   ]
   ```

3. **UI Rendering:**
   - The `MessageReasoning` component displays reasoning parts
   - Text parts are displayed as regular messages
   - Reasoning is collapsible and shown in a distinct style

## Troubleshooting

### Reasoning not appearing?

1. **Check the model configuration:**
   - Ensure you're using `gemini-2.0-flash-thinking-exp-1219` or a model that supports thinking
   - Verify the middleware is configured with the correct tag name

2. **Check API key:**
   - Ensure `GOOGLE_GENERATIVE_AI_API_KEY` is set correctly

3. **Check model output:**
   - Some prompts may not trigger reasoning
   - Try more complex questions that require step-by-step thinking

4. **Check browser console:**
   - Look for any errors related to model responses
   - Verify message parts include a "reasoning" type

### Model not available?

Experimental models may be deprecated or renamed. Check Google's documentation for current model names:
- https://ai.google.dev/gemini-api/docs/models/gemini

## Future Improvements

1. **Support for multiple reasoning tag formats:**
   - Some models might use different tag names
   - Could add support for `<reasoning>`, `<thought>`, etc.

2. **Model-specific configurations:**
   - Create a configuration map for different providers
   - Auto-detect appropriate settings based on model ID

3. **Fallback handling:**
   - If thinking model fails, automatically fall back to regular model with prompt guidance

4. **Better error messages:**
   - Inform users when reasoning is not available for a selected model
   - Suggest alternative models with reasoning support

## References

- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Google AI SDK for JavaScript](https://github.com/google/generative-ai-js)
- [Vercel AI SDK Middleware](https://sdk.vercel.ai/docs/ai-sdk-core/middleware)
- [Google Gemini Models](https://ai.google.dev/gemini-api/docs/models/gemini)
