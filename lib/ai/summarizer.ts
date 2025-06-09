/**
 * @file lib/ai/summarizer.ts
 * @description Серверная логика для асинхронной генерации краткого содержания (саммари) для артефактов.
 * @version 1.3.0
 * @date 2025-06-09
 * @updated Переход на работу с `Artifact` вместо `Document`.
 */

/** HISTORY:
 * v1.3.0 (2025-06-09): Адаптировано под новую схему `Artifact`.
 * v1.2.0 (2025-06-07): Убран выбор специализированной image-generation модели.
 */

import 'server-only';
import { generateText } from 'ai';
import { myProvider } from './providers';
import { db } from '../db/queries';
import { artifact } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import type { ArtifactKind } from '@/components/artifact';

const getSummaryPrompt = (kind: ArtifactKind, content: string): string => {
  switch (kind) {
    case 'image':
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
  artifactId: string,
  content: string,
  kind: ArtifactKind,
): Promise<void> {
  try {
    const prompt = getSummaryPrompt(kind, content);
    const model = myProvider.languageModel('title-model');

    const { text: summary } = await generateText({
      model: model,
      prompt: prompt,
    });

    if (summary) {
      const [latestVersion] = await db
        .select()
        .from(artifact)
        .where(eq(artifact.id, artifactId))
        .orderBy(desc(artifact.createdAt))
        .limit(1);

      if (latestVersion) {
        await db
          .update(artifact)
          .set({ summary })
          .where(eq(artifact.createdAt, latestVersion.createdAt));
      }
    }
  } catch (error) {
    console.error(`SYS_SUMMARIZER: Failed to generate summary for artifact ${artifactId}`, error);
  }
}

// END OF: lib/ai/summarizer.ts
