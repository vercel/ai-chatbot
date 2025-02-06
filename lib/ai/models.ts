// import { openai } from "@ai-sdk/openai";
// import { fireworks } from "@ai-sdk/fireworks";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { createOllama } from "ollama-ai-provider";

const ollama = createOllama({
  baseURL: `${process.env.OLLAMA_HOST}/api`,
});
export const DEFAULT_CHAT_MODEL: string = "chat-model-small";

export const myProvider = customProvider({
  languageModels: {
    "chat-model-small": ollama("deepseek-coder:33b"), //openai("gpt-4o-mini"),
    // "chat-model-large": openai("gpt-4o"),
    // "chat-model-reasoning": wrapLanguageModel({
    //   model: fireworks("accounts/fireworks/models/deepseek-r1"),
    //   middleware: extractReasoningMiddleware({ tagName: "think" }),
    // }),
    // "title-model": openai("gpt-4-turbo"),
    // "block-model": openai("gpt-4o-mini"),
    "chat-model-local": ollama("deepseek-coder:33b"),
    "chat-model-local-mini": ollama("deepseek-r1:1.5b"),
  },
  imageModels: {
    // "small-model": openai.image("dall-e-2"),
    // "large-model": openai.image("dall-e-3"),
  },
});

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: "chat-model-local",
    name: "Deepseek-Coder 33B",
    description: "Local model for fast, lightweight tasks",
  },
  {
    id: "chat-model-local-mini",
    name: "deepseek-r1 1.5b",
    description: "mini model for testing",
  },
  // {
  //   id: "chat-model-small",
  //   name: "Small model",
  //   description: "Small model for fast, lightweight tasks",
  // },
  // {
  //   id: "chat-model-large",
  //   name: "Large model",
  //   description: "Large model for complex, multi-step tasks",
  // },
  // {
  //   id: "chat-model-reasoning",
  //   name: "Reasoning model",
  //   description: "Uses advanced reasoning",
  // },
];
