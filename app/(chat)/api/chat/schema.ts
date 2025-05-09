import { z } from 'zod';

const textPartSchema = z.object({
  text: z.string().min(1).max(2000),
  type: z.enum(['text']),
});

// Add more flexible validation to handle AI SDK's format
export const messageSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.coerce.date(),
  role: z.enum(['user']),
  content: z.string().min(1).max(2000),
  parts: z.array(textPartSchema),
  experimental_attachments: z
    .array(
      z.object({
        url: z.string().url(),
        name: z.string().min(1).max(2000),
        contentType: z.enum(['image/png', 'image/jpg', 'image/jpeg']),
      }),
    )
    .optional(),
});

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: messageSchema,
  selectedChatModel: z.string().refine(
    (value) => {
      // Accept all model IDs in the format provider-modelname
      // This allows any model ID to be used if it follows the standard format
      return (
        value.includes('-') ||
        value === 'chat-model' ||
        value === 'chat-model-reasoning'
      );
    },
    {
      message: 'Invalid model ID format. Expected format: provider-modelname',
    },
  ),
  selectedVisibilityType: z.enum(['public', 'private']),
});

// Add a schema for the AI SDK format
export const aiSdkRequestSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
      createdAt: z.coerce.date().optional(),
      name: z.string().optional(),
    }),
  ),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
export type AiSdkRequest = z.infer<typeof aiSdkRequestSchema>;
