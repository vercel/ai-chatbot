import { getCachedAvailableModels, type ModelInfo } from "./model-fetcher";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
  provider: string;
};

// Fallback models in case API fetching fails
const FALLBACK_MODELS: ChatModel[] = [
  {
    id: "mistral-large-2407",
    name: "Mistral Large",
    description: "Advanced large language model with superior reasoning capabilities",
    provider: "mistral"
  },
  {
    id: "open-mistral-7b",
    name: "Mistral 7B", 
    description: "Fast and efficient model for simple tasks",
    provider: "mistral"
  },
  {
    id: "codestral-latest",
    name: "Codestral",
    description: "Specialized model for code generation and analysis",
    provider: "mistral"
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description: "Google's most advanced thinking model for complex reasoning",
    provider: "google"
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash", 
    description: "Best price-performance model for large scale processing",
    provider: "google"
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash-Lite",
    description: "Fastest flash model optimized for cost-efficiency",
    provider: "google"
  }
];

// Check which providers have API keys configured
function getAvailableProviders(): string[] {
  const providers: string[] = [];
  
  if (process.env.MISTRAL_API_KEY) {
    providers.push("mistral");
  }
  
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY) {
    providers.push("google");
  }
  
  return providers;
}

// Dynamically load models based on available providers (synchronous fallback)  
export function getAvailableModels(): ChatModel[] {
  // Use the API fetcher directly
  return getAvailableModelsFromAPI();
}

// Sync function to get models from API
export function getAvailableModelsFromAPI(): ChatModel[] {
  try {
    const models = getCachedAvailableModels();
    
    
    if (models.length > 0) {
      
      return models;
    } else {
      
      return FALLBACK_MODELS;
    }
  } catch (error) {
    
    return FALLBACK_MODELS;
  }
}

// Initialize models at startup - this ensures they're available for components
let _cachedModels: ChatModel[] | null = null;

function initializeModels(): ChatModel[] {
  if (_cachedModels === null) {
    _cachedModels = getAvailableModels();
  }
  return _cachedModels;
}

// Helper functions to identify model capabilities
export function isReasoningModel(modelId: string): boolean {
  return modelId.includes("reasoning") || modelId === "chat-model-reasoning" || modelId === "mistral-large-reasoning";
}

export function getModelByLegacyId(legacyId: string): string {
  const models = getAvailableModels();
  
  switch (legacyId) {
    case "chat-model":
      return models.find(m => m.provider === "mistral" && m.name.includes("Large") && !m.name.includes("Reasoning"))?.id || 
             models.find(m => m.provider === "google" && m.name.includes("Pro"))?.id || 
             models[0]?.id || "mistral-large-latest";
    
    case "chat-model-reasoning":
      return "mistral-large-reasoning"; // This is created in providers.ts
    
    default:
      return legacyId;
  }
}

// Get the default chat model based on available providers
function _getDefaultChatModel(): string {
  const models = getAvailableModels();
  
  // Prefer Mistral Large if available
  const mistralLarge = models.find(m => m.id === "mistral-large-2407");
  if (mistralLarge) return mistralLarge.id;
  
  // Fallback to Google Gemini if available
  const geminiPro = models.find(m => m.id === "gemini-2.5-pro");
  if (geminiPro) return geminiPro.id;
  
  const geminiFlash = models.find(m => m.id === "gemini-2.5-flash");
  if (geminiFlash) return geminiFlash.id;
  
  // Fallback to first available model
  return models.length > 0 ? models[0].id : "mistral-large-2407";
}

// Lazy initialization to avoid circular dependencies
let _defaultModel: string | null = null;
export function getDefaultChatModel(): string {
  if (_defaultModel === null) {
    _defaultModel = _getDefaultChatModel();
  }
  return _defaultModel;
}

// Use a static default for now to avoid initialization issues
export const DEFAULT_CHAT_MODEL: string = "mistral-large-2407";

// Lazy export for models - getter function instead of direct export
let _chatModelsCache: ChatModel[] | null = null;

export function getChatModels(): ChatModel[] {
  if (_chatModelsCache === null) {
    // Get models from API synchronously
    _chatModelsCache = getAvailableModelsFromAPI();
  }
  
  return _chatModelsCache;
}

// Function to refresh models from API
export function refreshModels(): ChatModel[] {
  _chatModelsCache = null;
  return getChatModels();
}

// Export function instead of constant to avoid initialization issues
export const chatModels = getChatModels;
