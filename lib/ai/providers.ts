import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
  LanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";
import { getCachedAvailableModels } from "./model-fetcher";

// Initialize providers based on available API keys
const providers: Record<string, any> = {};

// Configure Mistral client if API key is available
if (process.env.MISTRAL_API_KEY) {
  providers.mistral = createMistral({
    apiKey: process.env.MISTRAL_API_KEY,
  });
} else if (!isTestEnvironment) {
  console.warn(
    "⚠️  MISTRAL_API_KEY is not configured. Mistral models will be unavailable."
  );
}

// Configure Google client if API key is available
if (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY) {
  providers.google = createGoogleGenerativeAI({
    apiKey:
      process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY,
  });
} else if (!isTestEnvironment) {
  console.warn(
    "⚠️  GOOGLE_GENERATIVE_AI_API_KEY is not configured. Google models will be unavailable."
  );
}

// Configure Hugging Face Router (OpenAI-compatible) if token is available
if (process.env.HF_TOKEN) {
  const hfSettings: any = {
    apiKey: process.env.HF_TOKEN,
    baseURL: "https://router.huggingface.co/v1",
    // Ensure we use the Chat Completions API for routers that don't support Responses API
    compatibility: "strict",
  };
  providers.hf = createOpenAI(hfSettings);
} else if (!isTestEnvironment) {
  console.warn(
    "⚠️  HF_TOKEN is not configured. Hugging Face OpenAI-compatible models will be unavailable."
  );
}

// Create language models dynamically based on available models
function createLanguageModels() {
  const availableModels = getCachedAvailableModels();
  const languageModels: Record<string, any> = {};

  availableModels.forEach((model) => {
    try {
      if (model.provider === "mistral" && providers.mistral) {
        languageModels[model.id] = providers.mistral(model.id);
      } else if (model.provider === "google" && providers.google) {
        languageModels[model.id] = providers.google(model.id);
      } else if ((model.provider === "hf" || model.provider === "huggingface") && providers.hf) {
        // OpenAI-compatible models served via Hugging Face router
        languageModels[model.id] = providers.hf(model.id);
      } else {
      }
    } catch (error) {}
  });

  // Add special models for specific purposes
  if (providers.mistral) {
    try {
      // Add reasoning model with middleware
      languageModels["mistral-large-reasoning"] = wrapLanguageModel({
        model: providers.mistral("mistral-large-2407"),
        middleware: extractReasoningMiddleware({ tagName: "think" }),
      });
    } catch (error) {}
  }

  return languageModels;
}

// Get default models based on available providers
function getDefaultModels() {
  const defaults = {
    chat: "mistral-large-2407",
    title: "open-mistral-7b",
    artifact: "codestral-latest",
    reasoning: "mistral-large-reasoning",
  };

  // If Mistral is not available, fall back to Google
  if (!providers.mistral && providers.google) {
    defaults.chat = "gemini-1.5-pro";
    defaults.title = "gemini-1.5-flash";
    defaults.artifact = "gemini-1.5-pro";
    defaults.reasoning = "gemini-1.5-pro";
  }

  // If neither Mistral nor Google available, but HF is, use HF models
  if (!providers.mistral && !providers.google && providers.hf) {
    // Prefer the larger OSS model for chat
    defaults.chat = "openai/gpt-oss-120b:novita";
    defaults.title = "openai/gpt-oss-20b:novita";
    defaults.artifact = "openai/gpt-oss-20b:novita";
    defaults.reasoning = "openai/gpt-oss-120b:novita";
  }

  return defaults;
}

// Cache for the provider to avoid multiple initializations
let _providerCache: any = null;

function createProvider() {
  if (_providerCache) {
    return _providerCache;
  }

  if (isTestEnvironment) {
    const {
      artifactModel,
      chatModel,
      reasoningModel,
      titleModel,
    } = require("./models.mock");

    _providerCache = customProvider({
      languageModels: {
        "mistral-large-latest": chatModel,
        "mistral-large-reasoning": reasoningModel,
        "mistral-small-latest": titleModel,
        "codestral-latest": artifactModel,
      },
    });
  } else {
    const languageModels = createLanguageModels();
    const defaults = getDefaultModels();

    // Ensure we have the required default models
    const requiredModels: Record<string, any> = {};

    // Map old model IDs to new dynamic IDs for backward compatibility
    if (languageModels[defaults.chat]) {
      requiredModels["chat-model"] = languageModels[defaults.chat];
    }
    if (languageModels[defaults.reasoning]) {
      requiredModels["chat-model-reasoning"] =
        languageModels[defaults.reasoning];
    }
    if (languageModels[defaults.title]) {
      requiredModels["title-model"] = languageModels[defaults.title];
    }
    if (languageModels[defaults.artifact]) {
      requiredModels["artifact-model"] = languageModels[defaults.artifact];
    }

    const finalModels = {
      ...languageModels,
      ...requiredModels,
    };

    _providerCache = customProvider({
      languageModels: finalModels,
    });
  }

  return _providerCache;
}

export const myProvider = createProvider();
