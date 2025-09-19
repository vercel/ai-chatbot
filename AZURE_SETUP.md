# Azure OpenAI Setup for AI Chatbot

This document explains how to set up Azure OpenAI for the AI Chatbot application.

## Previous vs. Current Implementation

### Previous Implementation (Vercel AI Gateway)
The previous version of this application used the Vercel AI Gateway to access AI models:
- Required Vercel AI Gateway API keys or OIDC tokens
- Used xAI models (grok-2-vision-1212, grok-3-mini) through the gateway
- Required setting up AI_GATEWAY_API_KEY environment variable
- Authentication was handled automatically for Vercel deployments via OIDC tokens

### Current Implementation (Direct Azure OpenAI)
The current version uses Azure OpenAI directly:
- Connects directly to Azure OpenAI without an intermediary gateway
- Uses GPT-4o model for all functionality (chat, reasoning, title generation, artifacts)
- Requires Azure OpenAI endpoint and API key
- Gives you more control over model deployments and configurations
- Eliminates dependency on Vercel AI Gateway authentication
- May provide better performance and lower latency
- Allows you to use Azure's security features and compliance certifications

## Prerequisites

1. An Azure account with access to Azure OpenAI Service
2. Azure OpenAI Service resource with deployed models

## Setup Steps

### 1. Create Azure OpenAI Resource

If you haven't already, create a new Azure OpenAI resource from the Azure portal:

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Azure OpenAI"
3. Click "Create"
4. Follow the setup wizard to create your resource

### 2. Deploy Models

You need to deploy the following model in your Azure OpenAI resource:

- **GPT-4o** - Used for all functionality (chat, reasoning, title generation, artifacts)

To deploy the model:
1. Go to your Azure OpenAI resource
2. Navigate to "Model deployments"
3. Click "Create new deployment"
4. Select the GPT-4o model
5. Set the deployment name to "gpt-4o"

### 3. Configure Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
# Azure OpenAI configuration
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_OPENAI_API_KEY=your-azure-openai-api-key

# Supabase configuration (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Azure OpenAI resource under "Keys and Endpoint".

### 4. Model Deployment Names

The application expects the deployment name to be `gpt-4o`. If your deployment name is different, you'll need to update the `providers.ts` file accordingly.

## Code Changes

The main change in the code is in the `providers.ts` file, where we've replaced:

```javascript
// Previous implementation using Vercel AI Gateway
'chat-model': gateway.languageModel('xai/grok-2-vision-1212'),
'chat-model-reasoning': wrapLanguageModel({
  model: gateway.languageModel('xai/grok-3-mini'),
  middleware: extractReasoningMiddleware({ tagName: 'think' }),
}),
'title-model': gateway.languageModel('xai/grok-2-1212'),
'artifact-model': gateway.languageModel('xai/grok-2-1212'),
```

with:

```javascript
// Current implementation using Azure OpenAI directly
'chat-model': azure('gpt-4o'),
'chat-model-reasoning': wrapLanguageModel({
  model: azure('gpt-4o'),
  middleware: extractReasoningMiddleware({ tagName: 'think' }),
}),
'title-model': azure('gpt-4o'),
'artifact-model': azure('gpt-4o'),
```

## Troubleshooting

If you encounter issues:

1. Verify your Azure OpenAI endpoint and API key are correct
2. Check that your models are properly deployed with the correct deployment name
3. Ensure your Azure account has sufficient quota for the GPT-4o model
4. Check the Azure OpenAI Service logs for any errors
5. If you see "azure is not a function" errors, make sure you've installed the @ai-sdk/azure package