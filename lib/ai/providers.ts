import { anthropic } from "@ai-sdk/anthropic";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";

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
        // Standard chat model → Claude Sonnet 4.5
        "chat-model": anthropic("claude-sonnet-4-5"),
        // Reasoning chat model uses same ID; thinking enabled per-request in route
        "chat-model-reasoning": anthropic("claude-sonnet-4-5"),
        // Lightweight models for titles and artifact helpers
        "title-model": anthropic("claude-3-5-haiku-latest"),
        "artifact-model": anthropic("claude-3-5-haiku-latest"),
      },
    });
