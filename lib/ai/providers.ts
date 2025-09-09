import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

const isLocalMode = process.env.AI_GATEWAY_API_KEY === 'local';
const isVertexMode = process.env.AI_GATEWAY_API_KEY === 'vertex';

// Create Ollama provider for local models
const ollamaProvider = createOpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama',
});

// Create Vertex AI provider for Google Cloud
const vertexProvider = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_CLOUD_API_KEY,
});

// Determine the provider configuration based on environment
let providerConfig: {
  languageModels: Record<string, any>;
};

if (isTestEnvironment) {
  providerConfig = {
    languageModels: {
      'chat-model': chatModel,
      'chat-model-reasoning': reasoningModel,
      'title-model': titleModel,
      'artifact-model': artifactModel,
      'anthropic-claude-3-5-sonnet': chatModel,
      'openai-gpt-4o': chatModel,
      'vertex-gemini-pro': chatModel,
      'vertex-gemini-pro-vision': chatModel,
    },
  };
} else if (isVertexMode) {
  providerConfig = {
    languageModels: {
      'chat-model': vertexProvider('models/gemini-pro'),
      'chat-model-reasoning': wrapLanguageModel({
        model: vertexProvider('models/gemini-pro'),
        middleware: extractReasoningMiddleware({ tagName: 'think' }),
      }),
      'title-model': vertexProvider('models/gemini-pro'),
      'artifact-model': vertexProvider('models/gemini-pro'),
      'anthropic-claude-3-5-sonnet': vertexProvider('models/gemini-pro'),
      'openai-gpt-4o': vertexProvider('models/gemini-pro'),
      'vertex-gemini-pro': vertexProvider('models/gemini-pro'),
      'vertex-gemini-pro-vision': vertexProvider('models/gemini-pro-vision'),
    },
  };
} else if (isLocalMode) {
  providerConfig = {
    languageModels: {
      'chat-model': ollamaProvider('qwen3:30b'),
      'chat-model-reasoning': wrapLanguageModel({
        model: ollamaProvider('qwen3:30b'),
        middleware: extractReasoningMiddleware({ tagName: 'think' }),
      }),
      'title-model': ollamaProvider('falcon3:latest'),
      'artifact-model': ollamaProvider('falcon3:latest'),
      'anthropic-claude-3-5-sonnet': ollamaProvider('qwen3:30b'),
      'openai-gpt-4o': ollamaProvider('llama3.2-vision:latest'),
      'vertex-gemini-pro': ollamaProvider('mistral:latest'),
      'vertex-gemini-pro-vision': ollamaProvider('llava:latest'),
    },
  };
} else {
  providerConfig = {
    languageModels: {
      'chat-model': gateway.languageModel('xai/grok-2-vision-1212'),
      'chat-model-reasoning': wrapLanguageModel({
        model: gateway.languageModel('xai/grok-3-mini-beta'),
        middleware: extractReasoningMiddleware({ tagName: 'think' }),
      }),
      'title-model': gateway.languageModel('xai/grok-2-1212'),
      'artifact-model': gateway.languageModel('xai/grok-2-1212'),
      'anthropic-claude-3-5-sonnet': gateway.languageModel(
        'anthropic/claude-3-5-sonnet',
      ),
      'openai-gpt-4o': gateway.languageModel('openai/gpt-4o'),
      'vertex-gemini-pro': gateway.languageModel('google/gemini-pro'),
      'vertex-gemini-pro-vision': gateway.languageModel('google/gemini-pro-vision'),
    },
  };
}

export const myProvider = customProvider(providerConfig);

// Função para obter provider com load balancing inteligente
export async function getSmartProvider(
  modelType: 'chat' | 'vision' | 'reasoning' | 'artifact' = 'chat',
  userPreferences?: {
    preferredProvider?: string;
    maxCost?: number;
    maxLatency?: number;
  }
) {
  // Import dinâmico para evitar dependências circulares
  const { selectOptimalProvider } = await import('../load-balancing/load-balancer');

  const availableProviders = ['xai', 'anthropic', 'openai', 'google', 'ollama'];

  try {
    const decision = await selectOptimalProvider(availableProviders, modelType, userPreferences);

    // Retornar provider baseado na decisão
    const modelId = decision.model;
    const provider = myProvider.languageModel(modelId);

    return {
      provider,
      decision
    };
  } catch (error) {
    console.warn('Load balancing failed, using default provider:', error);

    // Fallback para provider padrão
    return {
      provider: myProvider.languageModel('chat-model'),
      decision: {
        provider: 'xai',
        model: 'chat-model',
        reason: 'Fallback due to load balancing error',
        score: 0,
        alternatives: []
      }
    };
  }
}
