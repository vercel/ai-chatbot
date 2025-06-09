/**
 * @file app/api/chat/schema.ts
 * @description Схемы валидации для API чата.
 * @version 1.5.0
 * @date 2025-06-07
 * @updated Схема `messageSchema.id` теперь принимает `z.string()` вместо `z.string().uuid()` для совместимости с ID от AI SDK.
 */

/** HISTORY:
 * v1.5.0 (2025-06-07): Ослаблена валидация ID сообщения до z.string() для поддержки ID от AI SDK.
 * v1.4.0 (2025-06-06): Уточнена схема partSchema для соответствия типам AI SDK.
 * v1.3.0 (2025-06-06): Поле `role` теперь валидируется как `['user', 'assistant', 'system', 'data']`.
 */

import { z } from 'zod'
import { artifactKinds } from '@/lib/artifacts/server'

const basePartSchema = z.object({
  type: z.string(),
})

const partSchema = z.union([
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({ type: z.literal('tool-invocation'), toolInvocation: z.any() }),
]).or(basePartSchema.passthrough())

const messageSchema = z.object({
  // ИЗМЕНЕНИЕ: Ослабляем валидацию с .uuid() до просто .string()
  // Это позволяет принимать как UUID от наших клиентов, так и строковые ID (например, 'msg-...') от AI SDK
  id: z.string(),
  createdAt: z.coerce.date().optional(),
  role: z.enum(['user', 'assistant', 'system', 'data', 'tool']),
  content: z.string(),
  parts: z.array(partSchema).optional(),
  experimental_attachments: z
    .array(
      z.object({
        url: z.string().url(),
        name: z.string(),
        contentType: z.string(),
      }),
    )
    .optional(),
})

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  messages: z.array(messageSchema),
  selectedChatModel: z.enum(['chat-model', 'chat-model-reasoning']),
  selectedVisibilityType: z.enum(['public', 'private']),
  activeArtifactId: z.string().uuid().optional(),
  activeArtifactTitle: z.string().optional(),
  activeArtifactKind: z.enum(artifactKinds).optional(),
})

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;

// END OF: app/api/chat/schema.ts
