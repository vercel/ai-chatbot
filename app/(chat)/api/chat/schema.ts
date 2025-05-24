import { z } from 'zod';

const textPartSchema = z.object({
  text: z.string().min(1).max(2000),
  type: z.enum(['text']),
});

const imagePartSchema = z.object({
  image: z.any(),
  type: z.enum(['image']),
});

const partSchema = z.union([textPartSchema, imagePartSchema]);

const experimentalAttachmentSchema = z.object({
  url: z.string(),
  contentType: z.string(),
  name: z.string(),
});

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: z.object({
    id: z.string().uuid(),
    createdAt: z.coerce.date(),
    role: z.enum(['user']),
    content: z.string().min(1).max(2000),
    parts: z.array(partSchema),
    experimental_attachments: z.array(experimentalAttachmentSchema).optional(),
  }),
  selectedChatModel: z.enum([
    'chat-model',
    'chat-model-reasoning',
    'n8n-assistant',
  ]),
  selectedVisibilityType: z.enum(['public', 'private']),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
