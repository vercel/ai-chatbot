/**
 * @file app/api/chat/schema.ts
 * @description Схемы валидации для API чата.
 * @version 1.6.0
 * @date 2025-06-10
 * @updated Импорт artifactKinds теперь из общего lib/types.
 */

/** HISTORY:
 * v1.6.0 (2025-06-10): Импорт artifactKinds теперь из общего lib/types.
 * v1.5.1 (2025-06-10): `activeArtifactKind` теперь использует `z.enum(artifactKinds)`.
 * v1.5.0 (2025-06-07): Ослаблена валидация ID сообщения до z.string() для поддержки ID от AI SDK.
 * v1.4.0 (2025-06-06): Уточнена схема partSchema для соответствия типам AI SDK.
 * v1.3.0 (2025-06-06): Поле `role` теперь валидируется как `['user', 'assistant', 'system', 'data']`.
 */

import { z } from 'zod'
import { artifactKinds } from '@/lib/types' // <-- ИЗМЕНЕН ИМПОРТ

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
  id: z.string(),
  messages: z.array(messageSchema),
  selectedChatModel: z.enum(['chat-model', 'chat-model-reasoning']),
  selectedVisibilityType: z.enum(['public', 'private']),
  activeArtifactId: z.string().optional(),
  activeArtifactTitle: z.string().optional(),
  activeArtifactKind: z.enum(artifactKinds).optional(),
})

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;

// END OF: app/api/chat/schema.ts
