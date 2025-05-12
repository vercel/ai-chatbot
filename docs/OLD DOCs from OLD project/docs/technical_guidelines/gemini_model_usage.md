# Gemini Model Usage Guideline for LostMind AI Chatbot

**Last Updated**: 2025-05-12

## Objective
This document provides the definitive guide for integrating and using Google Gemini models within the LostMind AI Chatbot project. All AI agent prompts and manual development efforts related to Gemini models **must** adhere to these guidelines to ensure consistency and the use of the latest appropriate model versions.

## Approved Model Identifiers

### Preferred Model: Gemini 2.5 Pro

Based on the latest official Google Cloud documentation (as of May 12, 2025), the following model identifiers **should** be used:

*   **For Gemini 2.5 Pro (Latest Preview version):**
    ```
    gemini-2.5-pro-preview-05-06  // Released May 6, 2025 - Latest version
    ```
*   **Previously Used Version (LostMind AI Website project):**
    ```
    gemini-2.5-pro-preview-03-25  // Released April 9, 2025 - Confirmed working in existing projects
    ```
*   **For Gemini 2.5 Flash (if implementing):**
    ```
    gemini-2.5-flash-preview  // Currently in limited preview
    ```

**Rationale:** The `gemini-2.5-pro-preview-05-06` model identifier is the newest official Google Cloud designation for the Gemini 2.5 Pro preview model (released May 6, 2025). According to Google, this new version includes improved code editing capabilities and better support for complex agentic workflows.

The slightly older `gemini-2.5-pro-preview-03-25` version has been confirmed to work successfully in the LostMind AI Website project and could be used as a fallback if any issues arise with the latest version.

## Model Specifications & Capabilities

| Specification | Gemini 2.5 Pro Details |
|---------------|------------------------|
| Context Window | 1M tokens standard (2M tokens coming soon) |
| Input Types | Text, Code, Images, Audio, Video |
| Output Types | Text, Code, JSON |
| Max Input Tokens | 1,048,576 |
| Max Output Tokens | 65,536 |
| Multimodal Support | Full support for images, audio, and video |
| Special Features | Grounding with Google Search, Code execution, System instructions, Function calling, Thinking, Context caching |
| Quota Limits | 20 queries per minute (QPM) |

**Note:** Gemini 1.5 models are being deprecated with scheduled discontinuation dates. The 1.5 Pro models are scheduled for deprecation until 2025-09-24.

## Implementation Options

Based on successful implementations across LostMind AI projects and the latest Google Cloud documentation, there are two possible approaches to integrate Gemini models. **Option 1 (Vertex AI) is preferred** as it has been proven in production in our existing projects and provides direct access to the most advanced model capabilities.

### Option 1: Google Cloud Vertex AI (Preferred Implementation)

The `/lib/ai/gemini-provider.ts` file should initialize and export Gemini model instances using the Vertex AI SDK as follows:

```typescript
import {
  VertexAI,
  HarmCategory,
  HarmBlockThreshold,
  Part,
  GenerateContentResult,
  GenerateContentResponse
} from '@google-cloud/vertexai';
import { GoogleAuth } from 'google-auth-library';

// Environment variables with fallbacks for model identifiers
// IMPORTANT: Use the latest model identifier from Google Cloud
const GEMINI_PRO_MODEL = process.env.VERTEX_AI_GEMINI_MODEL || 'gemini-2.5-pro-preview-05-06'; // Latest as of May 12, 2025
const GEMINI_PRO_MODEL_FALLBACK = 'gemini-2.5-pro-preview-03-25'; // Fallback version (confirmed working)
const GEMINI_FLASH_MODEL = process.env.VERTEX_AI_GEMINI_FLASH_MODEL || 'gemini-2.5-flash-preview';

// Configure Vertex AI client
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const LOCATION = 'us-central1'; // Standard location for Vertex AI

if (!PROJECT_ID) {
  console.warn(
    'GOOGLE_CLOUD_PROJECT_ID is not set in environment variables. Gemini models may not be available or function correctly.'
  );
}

// Initialize Vertex AI
export const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
});

// Configure safety settings (optional but recommended for production)
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Model configurations using the approved identifiers
export const geminiModels = {
  'gemini-pro': GEMINI_PRO_MODEL,
  'gemini-flash': GEMINI_FLASH_MODEL,
};

// Configure generation parameters for best performance
const defaultGenerationConfig = {
  temperature: 0.4,       // Lower temperature for more deterministic outputs
  topK: 32,               // Consider top 32 tokens
  topP: 0.95,             // Sample from the top 95% probability mass
  maxOutputTokens: 8192,  // Adjust based on your needs
};

/**
 * Helper function to get a model instance with fallback capabilities
 * @param modelId The key from geminiModels (e.g., 'gemini-pro')
 * @param customGenerationConfig Optional custom generation parameters
 * @param useFallback Whether to try fallback model if primary model fails
 * @returns Configured Gemini model instance
 */
export function getGeminiModel(modelId, customGenerationConfig = {}, useFallback = true) {
  // Verify model ID is valid
  if (!(modelId in geminiModels)) {
    throw new Error(`Invalid Gemini model ID: ${modelId}`);
  }
  
  // Get the model with safety settings and generation config
  try {
    const model = vertexAI.getGenerativeModel({
      model: geminiModels[modelId],
      safetySettings,
      generationConfig: {
        ...defaultGenerationConfig,
        ...customGenerationConfig, // Allow overriding defaults
      },
    });
    
    return model;
  } catch (error) {
    // If using the latest model fails and fallback is enabled, try the fallback model
    if (useFallback && geminiModels[modelId] === GEMINI_PRO_MODEL) {
      console.warn(`Error with latest Gemini model, falling back to ${GEMINI_PRO_MODEL_FALLBACK}:`, error);
      
      const fallbackModel = vertexAI.getGenerativeModel({
        model: GEMINI_PRO_MODEL_FALLBACK,
        safetySettings,
        generationConfig: {
          ...defaultGenerationConfig,
          ...customGenerationConfig,
        },
      });
      
      return fallbackModel;
    }
    
    // If not using fallback or if fallback isn't applicable, rethrow the error
    throw error;
  }
}

/**
 * Utility function to process a text prompt with Gemini
 * @param modelId The key from geminiModels (e.g., 'gemini-pro') 
 * @param prompt The text prompt to process
 * @param customGenerationConfig Optional custom generation parameters
 * @returns The model's response text
 */
export async function generateText(modelId, prompt, customGenerationConfig = {}) {
  try {
    const model = getGeminiModel(modelId, customGenerationConfig);
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    const response = result.response;
    
    if (response.candidates && response.candidates.length > 0 && 
        response.candidates[0].content && response.candidates[0].content.parts) {
      return response.candidates[0].content.parts.map(part => part.text).join('\n');
    }
    
    throw new Error('Invalid or empty response structure');
  } catch (error) {
    console.error(`Error generating text with ${modelId}:`, error);
    throw error;
  }
}
```

### Option 2: Vercel AI SDK with @ai-sdk/google

If integration with Vercel's AI SDK components is required (especially for UI streaming components), use the following implementation:

```typescript
import { createGoogleGenerativeAI, GoogleGenerativeAI } from '@ai-sdk/google';
import { StreamingTextResponse, AIStreamCallbacksAndOptions } from '@ai-sdk/ui';

// IMPORTANT: Environment variables with fallbacks for model identifiers
const GEMINI_PRO_MODEL = process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro-preview-05-06'; // Latest as of May 12, 2025
const GEMINI_PRO_MODEL_FALLBACK = 'gemini-2.5-pro-preview-03-25'; // Fallback version if needed
const GEMINI_FLASH_MODEL = process.env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash-preview';

// IMPORTANT: Ensure GEMINI_API_KEY is loaded from environment variables.
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.warn(
    'GEMINI_API_KEY is not set in environment variables. Gemini models may not be available or function correctly.'
  );
}

// Initialize Google AI with API key
export const googleAI = createGoogleGenerativeAI({
  apiKey: geminiApiKey,
});

// Model configurations using the approved identifiers
export const geminiModels = {
  'gemini-pro': googleAI(GEMINI_PRO_MODEL),
  'gemini-flash': googleAI(GEMINI_FLASH_MODEL),
} as const;

// Type exports
export type GeminiModelId = keyof typeof geminiModels;

/**
 * Get a model instance by ID
 * @param modelId The model identifier ('gemini-pro' or 'gemini-flash')
 * @returns The Gemini model instance
 */
export function getGeminiModel(modelId: GeminiModelId) {
  // Validation logic for Vercel AI SDK approach
  if (!geminiApiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set in environment variables. Cannot initialize Gemini models.'
    );
  }
  
  // Ensure the modelId is a valid key of geminiModels before accessing
  if (!(modelId in geminiModels)) {
    throw new Error(`Invalid Gemini model ID: ${modelId}`);
  }
  return geminiModels[modelId];
}

/**
 * Create a streaming AI response for route handlers
 * @param modelId The model identifier ('gemini-pro' or 'gemini-flash')
 * @param messages The conversation messages
 * @param options Additional streaming options
 * @returns StreamingTextResponse for Next.js route handlers
 */
export function streamingGeminiResponse(modelId: GeminiModelId, messages, options?: AIStreamCallbacksAndOptions) {
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  
  const model = getGeminiModel(modelId);
  const response = model.generateContent({
    messages: messages,
  });
  
  return new StreamingTextResponse(response, options);
}
```

## Authentication Requirements

### Option 1: Vertex AI Authentication (Preferred)

Vertex AI requires proper Google Cloud authentication. Based on the latest Google Cloud documentation (May 2025), the following approaches are supported:

1. **Service Account (Recommended for Production):**
   - Generate a service account key with appropriate permissions in Google Cloud Console.
   - Required role: `roles/aiplatform.user` (or appropriate custom role).
   - Store the JSON key file securely outside of version control.
   - Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to the key file.
   - For Vercel deployment, set this as a production secret.

2. **Application Default Credentials (ADC):**
   - For local development, use `gcloud auth application-default login`.
   - For production, use Workload Identity Federation when possible (recommended by Google for enhanced security).
   - For containerized deployments, ensure the service account has appropriate permissions.

3. **Workload Identity Federation (Google Recommended):**
   - For deployments on Cloud Run, GKE, or other Google Cloud services.
   - Eliminates the need for service account key files by establishing trust between services.
   - See [Google's Workload Identity documentation](https://cloud.google.com/iam/docs/workload-identity-federation) for setup.

### Option 2: Google AI API Key

If using the Vercel AI SDK approach:

- Obtain a Google AI Studio API key from [AI Studio](https://aistudio.google.com/).
- Store it securely in the `GEMINI_API_KEY` environment variable.
- Note that API keys have different quota limits than Vertex AI service accounts.
- Remember that API keys do not provide the same level of fine-grained permission control as service accounts.

## Required Environment Variables

### Option 1: Vertex AI (Preferred)
- `GOOGLE_CLOUD_PROJECT_ID`: Your Google Cloud project ID
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to service account JSON key file (if using service account auth)
- `VERTEX_AI_GEMINI_MODEL`: (Optional) Override for the Gemini Pro model identifier
- `VERTEX_AI_GEMINI_FLASH_MODEL`: (Optional) Override for the Gemini Flash model identifier
- `VERTEX_AI_LOCATION`: (Optional) Override for the Vertex AI location (default: 'us-central1')

### Option 2: Vercel AI SDK
- `GEMINI_API_KEY`: Your Google AI Studio API key
- `GEMINI_PRO_MODEL`: (Optional) Override for the Gemini Pro model identifier
- `GEMINI_FLASH_MODEL`: (Optional) Override for the Gemini Flash model identifier

## Best Practices for Production Use

### Performance Optimization
- Use streaming responses for chat interfaces to improve perceived latency.
- Set appropriate `temperature` and `top_k`/`top_p` values based on your use case.
- Consider caching responses for common queries if appropriate for your application.
- Use the Vertex AI Endpoint closest to your application's region to minimize latency.

### Error Handling
- Implement robust error handling for model errors, including rate limits and timeout scenarios.
- Consider implementing automatic retry logic with exponential backoff for transient errors.
- Always gracefully handle and log model errors with meaningful messages for debugging.

### Cost Management
- Monitor usage through Google Cloud Console to track costs.
- Implement rate limiting in your application to prevent unexpected spikes in usage.
- Consider using the 'Flash' model variants for less complex tasks to reduce costs.
- Set up billing alerts in Google Cloud to avoid unexpected charges.

### Security Considerations
- Never expose your API keys or service account credentials in client-side code.
- Implement input validation to prevent prompt injection attacks.
- Consider using system instructions to improve model safety and reliability.
- Follow the principle of least privilege when setting up service account permissions.

## Usage in Prompts
All AI agent prompts that involve modifying or using Gemini models must:
1. Reference this document (`docs/technical_guidelines/gemini_model_usage.md`).
2. Ensure any example code or instructions strictly use the model identifiers and initialization patterns specified herein.
3. Explicitly mention the Gemini 2.5 Pro version requirement for optimal performance.
4. Include the appropriate authentication method based on the deployment environment.

## Review and Updates
This document should be reviewed whenever Google releases new versions of the Gemini models (typically every 2-3 months) or publishes significant updates to the Vertex AI platform.

Based on Google's published versioning policy as of May 2025, Gemini models undergo the following lifecycle phases:
1. **Preview/Experimental**: Initial release with experimental features (current status of Gemini 2.5 Pro)
2. **Stable**: General availability following successful preview phase
3. **Deprecated**: 12-month support period after a newer version is released as stable
4. **Discontinued**: Service is terminated

## Cross-Project Verification
Before making significant changes to the Gemini integration approach, always verify against working implementations in other LostMind AI projects (particularly the `lostmindai-website` project's YouTube summarizer implementation).
