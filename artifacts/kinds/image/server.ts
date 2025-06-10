/**
 * @file artifacts/image/server.ts
 * @description Серверный обработчик для артефактов-изображений.
 * @version 3.0.0
 * @date 2025-06-10
 * @updated Refactored to export a standalone `imageTool` object, removing the factory function.
 */

/** HISTORY:
 * v3.0.0 (2025-06-10): Refactored to export a standalone tool object.
 * v2.4.0 (2025-06-10): Added `providerOptions` to `generateText` to request the correct image modality.
 * v2.3.0 (2025-06-09): Рефакторинг. Обработчик теперь возвращает URL изображения.
 */

import { myProvider } from '@/lib/ai/providers'
import { type CoreMessage, type GeneratedFile, generateText } from 'ai'
import { put } from '@vercel/blob'
import { generateUUID } from '@/lib/utils'
import { ChatSDKError } from '@/lib/errors'
import type { ArtifactTool } from '@/artifacts/kinds/artifact-tools'

export const imageTool: ArtifactTool = {
  kind: 'image',
  create: async ({ prompt }) => {
    const { files } = await generateText({
      model: myProvider.languageModel('omni-image-model'),
      prompt,
      providerOptions: {
        google: { responseModalities: ['IMAGE', 'TEXT'] },
      },
    })

    const imagePart = files.find(
      (p: GeneratedFile): p is GeneratedFile => p.mimeType?.startsWith('image/'),
    )

    if (!imagePart || !imagePart.uint8Array) {
      throw new ChatSDKError('bad_request:api', 'Image generation failed: no image data received from the model.')
    }

    const imageBuffer = Buffer.from(imagePart.uint8Array)
    const filename = `${generateUUID()}.png`

    const { url } = await put(filename, imageBuffer, { access: 'public' })
    return url
  },
  update: async ({ document, description }) => {
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
        { type: 'image', image: imageBufferOriginal },
      ],
    }]

    const { files } = await generateText({
      model: myProvider.languageModel('omni-image-model'),
      messages,
      providerOptions: {
        google: { responseModalities: ['IMAGE', 'TEXT'] },
      },
    })

    const imagePart = files.find(
      (p: GeneratedFile): p is GeneratedFile => p.mimeType?.startsWith('image/'),
    )
    if (!imagePart || !imagePart.uint8Array) {
      throw new ChatSDKError('bad_request:api', 'Image editing failed: no image data received from the model.')
    }

    const imageBufferNew = Buffer.from(imagePart.uint8Array)
    const filename = `${generateUUID()}.png`

    const { url } = await put(filename, imageBufferNew, { access: 'public' })
    return url
  },
}

// END OF: artifacts/image/server.ts
