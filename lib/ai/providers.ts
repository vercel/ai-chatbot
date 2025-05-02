import axios from 'axios';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

// Base function for making AI API calls
const makeAIApiCall = async ({
  apiEndpoint,
  apiKey,
  model,
  messages,
  temperature = 0.7,
  maxTokens,
  systemPrompt,
  reasoning = false,
}) => {
  try {
    // Prepare the messages array with system prompt if provided
    const finalMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    // For reasoning-enabled models, add a think instruction
    if (reasoning) {
      const reasoningSystem =
        'When solving problems, please think step by step and show your reasoning using <think>...</think> tags.';
      finalMessages.unshift({ role: 'system', content: reasoningSystem });
    }

    // Make the API call
    const response = await axios.post(
      apiEndpoint,
      {
        model,
        messages: finalMessages,
        temperature,
        ...(maxTokens && { max_tokens: maxTokens }),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    // Return standardized response format
    return {
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
      model: response.data.model,
    };
  } catch (error) {
    console.error(
      `AI API Error (${apiEndpoint}):`,
      error.response?.data || error.message,
    );
    throw new Error(`AI API call failed: ${error.message}`);
  }
};

// API implementations for different providers
const xaiAPI = {
  generate: async ({ model, messages, systemPrompt, reasoning = false }) => {
    const XAI_API_KEY = process.env.XAI_API_KEY || '';
    return makeAIApiCall({
      apiEndpoint: 'https://api.xai.com/v1/chat/completions',
      apiKey: XAI_API_KEY,
      model,
      messages,
      systemPrompt,
      reasoning,
    });
  },
  image: async ({ prompt }) => {
    const XAI_API_KEY = process.env.XAI_API_KEY || '';
    try {
      const response = await axios.post(
        'https://api.xai.com/v1/images/generations',
        {
          prompt,
          n: 1,
          size: '1024x1024',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${XAI_API_KEY}`,
          },
        },
      );

      return { url: response.data.data[0].url };
    } catch (error) {
      console.error(
        'XAI Image API Error:',
        error.response?.data || error.message,
      );
      throw error;
    }
  },
};

const googleAPI = {
  generate: async ({ model, messages, systemPrompt, reasoning = false }) => {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
    return makeAIApiCall({
      apiEndpoint:
        'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
      apiKey: GOOGLE_API_KEY,
      model,
      messages,
      systemPrompt,
      reasoning,
    });
  },
};

const deepseekAPI = {
  generate: async ({ model, messages, systemPrompt, reasoning = false }) => {
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
    return makeAIApiCall({
      apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
      apiKey: DEEPSEEK_API_KEY,
      model: 'deepseek-chat',
      messages,
      systemPrompt,
      reasoning,
    });
  },
};

// Custom API for the specific model with ID 4qz21b8oytHrxe6M13BfRgSXLo9mC5BkNMKX8UQBLQvb
const advancedModelAPI = {
  generate: async ({ messages, systemPrompt = '', reasoning = false }) => {
    const ADVANCED_API_KEY =
      process.env.ADVANCED_API_KEY || process.env.XAI_API_KEY || '';
    return makeAIApiCall({
      apiEndpoint: 'https://api.xai.com/v1/chat/completions',
      apiKey: ADVANCED_API_KEY,
      model: 'grok-3-pro',
      messages,
      systemPrompt,
      temperature: 0.2, // Lower temperature for more deterministic results
      maxTokens: 4000,
      reasoning,
    });
  },
};

// Custom provider function for our API implementation
const createCustomProvider = () => {
  // Define language models with our axios-based API implementations
  const languageModels = {
    // Basic chat models
    'chat-model': async ({ messages, systemPrompt }) => {
      return xaiAPI.generate({
        model: 'grok-2-vision-1212',
        messages,
        systemPrompt,
      });
    },
    'chat-model-reasoning': async ({ messages, systemPrompt }) => {
      return xaiAPI.generate({
        model: 'grok-3-mini-beta',
        messages,
        systemPrompt,
        reasoning: true,
      });
    },
    'title-model': async ({ messages, systemPrompt }) => {
      return xaiAPI.generate({
        model: 'grok-2-1212',
        messages,
        systemPrompt,
      });
    },
    'artifact-model': async ({ messages, systemPrompt }) => {
      return xaiAPI.generate({
        model: 'grok-2-1212',
        messages,
        systemPrompt,
      });
    },

    // Google Gemini models
    'gemini-2.0-flash': async ({ messages, systemPrompt }) => {
      return googleAPI.generate({
        model: 'gemini-1.5-flash',
        messages,
        systemPrompt,
      });
    },
    'gemini-2.0-flash-reasoning': async ({ messages, systemPrompt }) => {
      return googleAPI.generate({
        model: 'gemini-1.5-flash',
        messages,
        systemPrompt,
        reasoning: true,
      });
    },

    // DeepSeek models
    'deepseek-chat': async ({ messages, systemPrompt }) => {
      return deepseekAPI.generate({
        model: 'deepseek-chat',
        messages,
        systemPrompt,
      });
    },
    'deepseek-chat-reasoning': async ({ messages, systemPrompt }) => {
      return deepseekAPI.generate({
        model: 'deepseek-chat',
        messages,
        systemPrompt,
        reasoning: true,
      });
    },

    // Advanced model with specific ID
    '4qz21b8oytHrxe6M13BfRgSXLo9mC5BkNMKX8UQBLQvb': async ({
      messages,
      systemPrompt,
    }) => {
      return advancedModelAPI.generate({
        messages,
        systemPrompt,
      });
    },
  };

  // Define image models
  const imageModels = {
    'small-model': async ({ prompt }) => {
      return xaiAPI.image({ prompt });
    },
  };

  // Return provider interface
  return {
    languageModels,
    imageModels,
  };
};

// Test environment implementation
const testProvider = {
  languageModels: {
    'chat-model': chatModel,
    'chat-model-reasoning': reasoningModel,
    'title-model': titleModel,
    'artifact-model': artifactModel,
  },
  imageModels: {
    'small-model': async ({ prompt }) => ({
      url: `https://test-image-url.com?prompt=${encodeURIComponent(prompt)}`,
    }),
  },
};

// Export the appropriate provider based on environment
export const myProvider = isTestEnvironment
  ? testProvider
  : createCustomProvider();
