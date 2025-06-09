/**
 * @file artifacts/image/server.ts
 * @description Серверный обработчик для артефактов-изображений.
 * @version 2.0.0
 * @date 2025-06-07
 * @updated Полный рефакторинг для работы с omni-моделью через стандартные DocumentHandler.
 */

/** HISTORY:
 * v2.0.0 (2025-06-07): Рефакторинг. Логика генерации и редактирования перенесена сюда, используется omni-модель.
 * v1.2.0 (2025-06-07): Исправлена работа с результатом `generateText` для корректного извлечения сгенерированного файла.
 * v1.1.0 (2025-06-07): Удален некорректный параметр `mode`, `experimental_parts` заменен на `experimental_output`.
 * v1.0.0 (2025-06-07): Начальная версия с поддержкой text-to-image и image-to-image, интеграция с Vercel Blob.
 */

import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { generateText, type CoreMessage, type GeneratedFile } from 'ai';
import { put } from '@vercel/blob';
import { generateUUID } from '@/lib/utils';
import { ChatSDKError } from '@/lib/errors';

export const imageDocumentHandler = createDocumentHandler<'image'>({
  kind: 'image',
  onCreateDocument: async ({ title, dataStream }) => {
    const { files } = await generateText({
      model: myProvider.languageModel('omni-image-model'),
      prompt: title,
    });

    const imagePart = files.find(
      (p: GeneratedFile): p is GeneratedFile => p.mimeType?.startsWith('image/')
    );

    if (!imagePart || !imagePart.uint8Array) {
      throw new ChatSDKError('bad_request:api', "Image generation failed: no image data received from the model.");
    }

    const imageBuffer = Buffer.from(imagePart.uint8Array);
    const filename = `${generateUUID()}.png`;

    const { url } = await put(filename, imageBuffer, { access: 'public' });

    dataStream.writeData({ type: 'image-delta', content: url });

    return url;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    const imageUrl = document.content;
    if (!imageUrl) {
      throw new ChatSDKError('bad_request:api', "Cannot update image: source document content (URL) is empty.");
    }

    // Загружаем исходное изображение по URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
        throw new ChatSDKError('bad_request:api', `Failed to fetch original image from URL: ${imageUrl}`);
    }
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBufferOriginal = Buffer.from(imageArrayBuffer);

    const messages: CoreMessage[] = [{
      role: 'user',
      content: [
        { type: 'text', text: description },
        { type: 'image', image: imageBufferOriginal }
      ]
    }];

    const { files } = await generateText({
      model: myProvider.languageModel('omni-image-model'),
      messages,
    });

    const imagePart = files.find(
      (p: GeneratedFile): p is GeneratedFile => p.mimeType?.startsWith('image/')
    );
    if (!imagePart || !imagePart.uint8Array) {
      throw new ChatSDKError('bad_request:api', "Image editing failed: no image data received from the model.");
    }

    const imageBufferNew = Buffer.from(imagePart.uint8Array);
    const filename = `${generateUUID()}.png`;

    const { url } = await put(filename, imageBufferNew, { access: 'public' });

    dataStream.writeData({ type: 'image-delta', content: url });

    return url;
  },
});

// END OF: artifacts/image/server.ts
