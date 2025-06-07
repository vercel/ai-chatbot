/**
 * @file app/api/chat/schema.ts
 * @description Схемы валидации для API чата.
 * @version 1.4.0
 * @date 2025-06-06
 * @updated Схема `partSchema` сделана более гибкой с использованием `z.union`.
 */

/** HISTORY:
 * v1.4.0 (2025-06-06): Уточнена схема partSchema для соответствия типам AI SDK.
 * v1.3.0 (2025-06-06): Поле `role` теперь валидируется как `['user', 'assistant', 'system', 'data']`.
 * v1.2.0 (2025-06-06): Заменено поле `message` на `messages: z.array(...)`.
 */

import { z } from 'zod'
import { artifactKinds } from '@/lib/artifacts/server'

// Схема, которая соответствует базовой части, чтобы TypeScript был доволен
const basePartSchema = z.object({
  type: z.string(),
})

// Мы не можем знать все типы, которые может прислать AI SDK,
// поэтому используем z.any() и passthrough для остальных свойств.
const partSchema = z.union([
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({ type: z.literal('tool-invocation'), toolInvocation: z.any() }),
  // Добавьте другие известные типы по мере необходимости
]).or(basePartSchema.passthrough())

const messageSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.coerce.date().optional(),
  role: z.enum(['user', 'assistant', 'system', 'data', 'tool']), // 'tool' добавлен для полноты
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
