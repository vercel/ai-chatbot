import { gateway } from "@ai-sdk/gateway";
import { google } from "@ai-sdk/google";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
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
        "chat-model": google("gemini-2.0-flash-exp"),
        "chat-model-reasoning": wrapLanguageModel({
          // Use Gemini's experimental thinking model for native reasoning support
          model: google("gemini-2.0-flash-thinking-exp-1219"),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        "title-model": google("gemini-2.0-flash-exp"),
        "artifact-model": google("gemini-2.0-flash-exp"),
      },
    });
