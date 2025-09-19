import { z } from 'zod/v4';

const textPartSchema = z.object({
  type: z.enum(['text']),
  text: z.string().min(1).max(200000), // Increased to 500k to support full transcript content
});

const filePartSchema = z.object({
  type: z.enum(['file']),
  mediaType: z.enum(['image/jpeg', 'image/png']),
  name: z.string().min(1).max(100),
  url: z.string().url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: z.object({
    id: z.string().uuid(),
    role: z.enum(['user']),
    parts: z.array(partSchema),
  }),
  reasoningEffort: z.enum(['low', 'medium', 'high']),
  selectedVisibilityType: z.enum(['public', 'private']),
  agentSlug: z.string().optional(),
  agentContext: z
    .object({
      agentName: z.string().min(1),
      agentDescription: z.string().optional(),
      agentPrompt: z.string().optional(),
    })
    .optional(),
  activeTools: z.array(z.string()).optional(),
  agentVectorStoreId: z.string().min(1).optional(),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
