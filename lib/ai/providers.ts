import { gateway } from "@ai-sdk/gateway";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";
import { internalAIProvider } from "./custom-provider";

// Sử dụng AI agent nội bộ thay vì external providers
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
          "npo-yen-model": chatModel,
          "cs-ai-model": reasoningModel,
          "cs-minh-model": titleModel,
        },
      });
    })()
  : internalAIProvider;
