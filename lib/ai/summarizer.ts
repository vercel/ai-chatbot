/**
 * @file lib/ai/summarizer.ts
 * @description Серверная логика для асинхронной генерации краткого содержания (саммари) для артефактов.
 * @version 1.2.0
 * @date 2025-06-07
 * @updated Исправлен выбор модели для генерации саммари по изображению на универсальную vision-модель.
 */

/** HISTORY:
 * v1.2.0 (2025-06-07): Убран выбор специализированной image-generation модели, теперь всегда используется 'title-model'.
 * v1.1.0 (2025-06-07): Исправлен запрос к БД на корректный синтаксис Drizzle.
 * v1.0.0 (2025-06-07): Создание файла и реализация функции generateAndSaveSummary.
 */

import 'server-only';
import { generateText } from 'ai';
import { myProvider } from './providers';
import { db } from '../db/queries';
import { document } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import type { ArtifactKind } from '@/components/artifact';

const getSummaryPrompt = (kind: ArtifactKind, content: string): string => {
  switch (kind) {
    case 'image':
      // Для картинок контент - это URL. Vision-модель сможет его обработать.
      return `Опиши это изображение кратко, в пределах 15 слов. URL изображения: ${content}`;
    case 'code':
      return `Сделай очень краткое саммари для этого фрагмента кода (не более 15 слов), объясняя его назначение: \n\n${content}`;
    case 'sheet':
      return `Сделай очень краткое саммари для этой таблицы (не более 15 слов), описывая ее содержимое: \n\n${content}`;
    case 'text':
    default:
      return `Сделай очень краткое саммари для этого текста (не более 20 слов): \n\n${content}`;
  }
};

export async function generateAndSaveSummary(
  documentId: string,
  content: string,
  kind: ArtifactKind,
): Promise<void> {
  try {
    const prompt = getSummaryPrompt(kind, content);

    // ИСПРАВЛЕНИЕ: Всегда используем универсальную модель с vision-возможностями.
    const model = myProvider.languageModel('title-model');

    const { text: summary } = await generateText({
      model: model,
      prompt: prompt,
    });

    if (summary) {
      // Находим последнюю версию документа по ID и обновляем ее
      const [latestVersion] = await db
        .select()
        .from(document)
        .where(eq(document.id, documentId))
        .orderBy(desc(document.createdAt))
        .limit(1);

      if (latestVersion) {
        await db
          .update(document)
          .set({ summary })
          .where(eq(document.createdAt, latestVersion.createdAt));
      }
    }
  } catch (error) {
    console.error(`SYS_SUMMARIZER: Failed to generate summary for document ${documentId}`, error);
    // Ошибку не пробрасываем выше, чтобы не сломать основной поток.
  }
}

// END OF: lib/ai/summarizer.ts
