export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  provider: string;
  category?: "general" | "image" | "code";
}

// Simple function to get available models based on API keys
export function getAvailableModelsSync(): ModelInfo[] {
  const models: ModelInfo[] = [];

  // Add Mistral models if API key is available
  if (process.env.MISTRAL_API_KEY) {
  models.push(
      {
        id: "mistral-large-2407",
        name: "Mistral Large",
        description: "Advanced large language model with superior reasoning capabilities",
    provider: "mistral",
    category: "general",
      },
      {
        id: "open-mistral-7b",
        name: "Mistral 7B",
        description: "Fast and efficient model for simple tasks",
    provider: "mistral",
    category: "general",
      },
      {
        id: "codestral-latest",
        name: "Codestral",
        description: "Specialized model for code generation and analysis",
    provider: "mistral",
    category: "code",
      }
    );
  }

  // Add Google models if API key is available
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY) {
    models.push(
      {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        description: "Google's most advanced thinking model for complex reasoning",
        provider: "google",
        category: "general",
      },
      {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash", 
        description: "Best price-performance model for large scale processing",
        provider: "google",
        category: "general",
      },
      {
        id: "gemini-2.5-flash-lite",
        name: "Gemini 2.5 Flash-Lite",
        description: "Fastest flash model optimized for cost-efficiency",
        provider: "google",
        category: "general",
      },
      {
        id: "imagen-4.0-generate-001",
        name: "Imagen 4.0 (Image Gen)",
        description: "Google Imagen model for image generation",
        provider: "google",
        category: "image",
      }
    );
  }

  // Add Hugging Face OpenAI-compatible OSS models if HF token is available
  if (process.env.HF_TOKEN) {
    models.push(
      {
        id: "openai/gpt-oss-120b:novita",
        name: "GPT-OSS 120B (HF)",
        description: "OpenAI-compatible 120B OSS model via Hugging Face Inference Providers",
        provider: "hf",
        category: "general",
      },
      {
        id: "openai/gpt-oss-20b:novita",
        name: "GPT-OSS 20B (HF)",
        description: "OpenAI-compatible 20B OSS model via Hugging Face Inference Providers",
        provider: "hf",
        category: "general",
      },
  // Note: Removing HF image generation model from selector
    );
  }

  // Add Stability image models if API key is available (support common aliases)
  if (process.env.STABILITY_API_KEY || (process.env as any).STABILITY_KEY || (process.env as any).STABILITYAI_API_KEY) {
    models.push(
      {
        id: "sd3.5-large",
        name: "Stability SD 3.5 Large",
        description: "High-quality image generation (6.5 credits/generation)",
        provider: "stability",
        category: "image",
      },
      {
        id: "sd3.5-large-turbo",
        name: "Stability SD 3.5 Large Turbo",
        description: "Faster image generation (4 credits/generation)",
        provider: "stability",
        category: "image",
      },
      {
        id: "sd3.5-medium",
        name: "Stability SD 3.5 Medium",
        description: "Balanced quality and cost (3.5 credits/generation)",
        provider: "stability",
        category: "image",
      },
      {
        id: "sd3.5-flash",
        name: "Stability SD 3.5 Flash",
        description: "Lowest cost fast generation (2.5 credits/generation)",
        provider: "stability",
        category: "image",
      }
    );
  }

  return models;
}

// Cache for models
let _modelCache: ModelInfo[] | null = null;

export function getCachedAvailableModels(): ModelInfo[] {
  if (_modelCache === null) {
    _modelCache = getAvailableModelsSync();
  }
  
  return _modelCache;
}

// Function to refresh the cache
export function refreshModelCache(): ModelInfo[] {
  _modelCache = null;
  return getCachedAvailableModels();
}