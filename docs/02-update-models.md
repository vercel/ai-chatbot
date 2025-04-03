# Update Models

The chatbot template ships with [xAI](https://sdk.vercel.ai/providers/ai-sdk-providers/xai) as the default model provider. Since the template is powered by the [AI SDK](https://sdk.vercel.ai), which supports [multiple providers](https://sdk.vercel.ai/providers/ai-sdk-providers) out of the box, you can easily switch to another provider of your choice.

To update the models, you will need to update the custom provider called `myProvider` at `/lib/ai/models.ts` shown below.

```ts
import { customProvider } from "ai";
import { xai } from "@ai-sdk/xai";
import { groq } from "@ai-sdk/groq";
import { fal } from "@ai-sdk/fal";

export const myProvider = customProvider({
  languageModels: {
    "chat-model": xai("grok-2-1212"),
    "chat-model-reasoning": wrapLanguageModel({
      model: groq("deepseek-r1-distill-llama-70b"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    "title-model": xai("grok-2-1212"),
    "artifact-model": xai("grok-2-1212"),
  },
  imageModels: {
    "small-model": fal.image("fal-ai/fast-sdxl"),
  },
});
```

You can replace the models with any other provider of your choice. You will need to install the provider library and switch the models accordingly.

For example, if you want to use Anthropic's `claude-3-5-sonnet` model for `chat-model`, you can replace the `xai` model with the `anthropic` model as shown below.

```ts
import { customProvider } from "ai";
import { fal } from "@ai-sdk/fal";
import { groq } from "@ai-sdk/groq";
import { anthropic } from "@ai-sdk/anthropic";

export const myProvider = customProvider({
  languageModels: {
    "chat-model": anthropic("claude-3-5-sonnet"), // Replace xai with anthropic
    "chat-model-reasoning": wrapLanguageModel({
      model: groq("deepseek-r1-distill-llama-70b"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    "title-model": anthropic("claude-3-5-haiku"),
    "artifact-model": anthropic("claude-3-5-haiku"),
  },
  imageModels: {
    "small-model": fal.image("fal-ai/fast-sdxl"),
  },
});
```

You can find the provider library and model names in the [provider](https://sdk.vercel.ai/providers/ai-sdk-providers)'s documentation. Once you have updated the models, you should be able to use the new models in your chatbot.
