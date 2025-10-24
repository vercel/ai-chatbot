import { createMistral } from "@ai-sdk/mistral";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

// Configure Mistral client with API key
const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

// Add validation for API key in development
if (!isTestEnvironment && !process.env.MISTRAL_API_KEY) {
  console.warn(
    "⚠️  MISTRAL_API_KEY is not configured. Please add your Mistral API key to .env.local"
  );
}

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        "chat-model": mistral("mistral-large-latest"),
        "chat-model-reasoning": wrapLanguageModel({
          model: mistral("mistral-large-latest"),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        "title-model": mistral("mistral-small-latest"),
        "artifact-model": mistral("codestral-latest"),
      },
    });
