import { z } from 'zod';

const textPartSchema = z.object({
  text: z.string().min(1).max(2000),
  type: z.enum(['text']),
});

const messageSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.coerce.date(),
  role: z.enum(['user']),
  content: z.string().min(1).max(2000),
  parts: z.array(textPartSchema).optional(),
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
  messages: z.array(messageSchema).min(1),
  selectedChatModel: z.enum(['chat-model', 'chat-model-reasoning', 'together-ai']),
  stream: z.boolean().optional(),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
