import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";

import { createGroq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";

const groq = createGroq({
  baseURL:
    "https://gateway.ai.cloudflare.com/v1/b4ca0337fb21e846c53e1f2611ba436c/chatbot-ai/groq",
});

import { isTestEnvironment } from "../constants";
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from "./models.test";

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        "chat-model": chatModel,
        "chat-model-reasoning": reasoningModel,
        "title-model": titleModel,
        "artifact-model": artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        "chat-llama3-70b": groq("llama3-70b-8192"),
        "chat-llama3.3-70b-versatile": groq("llama-3.3-70b-versatile"),
        "chat-llama-4-scout-17b": groq(
          "meta-llama/llama-4-scout-17b-16e-instruct",
        ),
        "chat-gemini-2.0-flash-lite": google("gemini-2.0-flash-lite"),
        "chat-gemini-1.5-flash-8b": google("gemini-1.5-flash-8b"),
        "chat-gemini-2.0-flash": google("gemini-2.0-flash"),
        "chat-gemini-2.0-flash-search": google("gemini-2.0-flash", {
          useSearchGrounding: true,
        }),
        "chat-model-reasoning": wrapLanguageModel({
          model: groq("qwen-qwq-32b"),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        "title-model": google("gemini-2.0-flash-lite"),
        "artifact-model": google("gemini-2.0-flash-lite"),
      },
      imageModels: {},
    });
