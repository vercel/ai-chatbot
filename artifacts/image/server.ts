/**
 * @file artifacts/image/server.ts
 * @description Серверный обработчик для артефактов-изображений.
 * @version 2.3.0
 * @date 2025-06-09
 * @updated Рефакторинг. Обработчик теперь возвращает URL изображения, а не пишет в стрим.
 */

/** HISTORY:
 * v2.3.0 (2025-06-09): Обработчик теперь возвращает URL.
 * v2.2.0 (2025-06-09): Добавлена проверка на `dataStream` перед записью.
 * v2.1.0 (2025-06-09): Обновлен импорт `createDocumentHandler`.
 */

import { myProvider } from '@/lib/ai/providers'
import { createDocumentHandler } from '@/lib/artifacts/factory'
import { type CoreMessage, type GeneratedFile, generateText } from 'ai'
import { put } from '@vercel/blob'
import { generateUUID } from '@/lib/utils'
import { ChatSDKError } from '@/lib/errors'

export const imageDocumentHandler = createDocumentHandler<'image'>({
  kind: 'image',
  onCreateDocument: async ({ title }) => {
    const { files } = await generateText({
      model: myProvider.languageModel('omni-image-model'),
      prompt: title,
    })

    const imagePart = files.find(
      (p: GeneratedFile): p is GeneratedFile => p.mimeType?.startsWith('image/')
    )

    if (!imagePart || !imagePart.uint8Array) {
      throw new ChatSDKError('bad_request:api', 'Image generation failed: no image data received from the model.')
    }

    const imageBuffer = Buffer.from(imagePart.uint8Array)
    const filename = `${generateUUID()}.png`

    const { url } = await put(filename, imageBuffer, { access: 'public' })

    return url
  },
  onUpdateDocument: async ({ document, description }) => {
    const imageUrl = document.content
    if (!imageUrl) {
      throw new ChatSDKError('bad_request:api', 'Cannot update image: source document content (URL) is empty.')
    }

    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new ChatSDKError('bad_request:api', `Failed to fetch original image from URL: ${imageUrl}`)
    }
    const imageArrayBuffer = await imageResponse.arrayBuffer()
    const imageBufferOriginal = Buffer.from(imageArrayBuffer)

    const messages: CoreMessage[] = [{
      role: 'user',
      content: [
        { type: 'text', text: description },
        { type: 'image', image: imageBufferOriginal }
      ]
    }]

    const { files } = await generateText({
      model: myProvider.languageModel('omni-image-model'),
      messages,
    })

    const imagePart = files.find(
      (p: GeneratedFile): p is GeneratedFile => p.mimeType?.startsWith('image/')
    )
    if (!imagePart || !imagePart.uint8Array) {
      throw new ChatSDKError('bad_request:api', 'Image editing failed: no image data received from the model.')
    }

    const imageBufferNew = Buffer.from(imagePart.uint8Array)
    const filename = `${generateUUID()}.png`

    const { url } = await put(filename, imageBufferNew, { access: 'public' })

    return url
  },
})

// END OF: artifacts/image/server.ts
