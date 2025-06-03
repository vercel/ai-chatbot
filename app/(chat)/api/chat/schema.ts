import { z } from 'zod';
import { allChatModels } from '@/lib/ai/models';

const textPartSchema = z.object({
  text: z.string().min(1).max(500000),
  type: z.enum(['text']),
});

// Extract all model IDs for validation
const modelIds = allChatModels.map((model) => model.id) as [
  string,
  ...string[],
];

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: z.object({
    id: z.string().uuid(),
    createdAt: z.coerce.date(),
    role: z.enum(['user']),
    content: z.string().min(1).max(500000),
    parts: z.array(textPartSchema),
    experimental_attachments: z
      .array(
        z.object({
          url: z.string().url(),
          name: z.string().min(1).max(2000),
          contentType: z.enum([
            'image/png',
            'image/jpg',
            'image/jpeg',
            'image/gif',
            'image/webp',
            'image/bmp',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain',
            'text/csv',
            'application/json',
            'text/markdown',
            'application/octet-stream',
          ]),
        }),
      )
      .optional(),
  }),
  selectedChatModel: z.enum(modelIds),
  selectedVisibilityType: z.enum(['public', 'private']),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
