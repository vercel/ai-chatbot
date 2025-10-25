import { z } from "zod";
import { getAvailableModels } from "@/lib/ai/models";

const textPartSchema = z.object({
  type: z.enum(["text"]),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.enum(["file"]),
  mediaType: z.enum(["image/jpeg", "image/png"]),
  name: z.string().min(1).max(100),
  url: z.string().url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

// Create dynamic enum for available models
const availableModelIds = getAvailableModels().map(model => model.id);
const modelEnumValues = availableModelIds.length > 0 
  ? availableModelIds as [string, ...string[]]
  : ["chat-model", "chat-model-reasoning"] as [string, ...string[]];

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: z.object({
    id: z.string().uuid(),
    role: z.enum(["user"]),
    parts: z.array(partSchema),
  }),
  selectedChatModel: z.enum(modelEnumValues),
  selectedVisibilityType: z.enum(["public", "private"]),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
