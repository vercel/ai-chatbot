/**
 * @file lib/ai/providers.ts
 * @description Конфигурация кастомного AI-провайдера.
 * @version 1.0.0
 * @date 2025-06-07
 * @updated Добавлена omni-модель `gemini-2.0-flash-preview-image-generation` для работы с изображениями.
 */

/** HISTORY:
 * v1.0.0 (2025-06-07): Начальная версия с добавлением omni-модели для изображений.
 */

import {
  customProvider,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { google } from '@ai-sdk/google';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
        'omni-image-model': artifactModel, // Для тестов используем ту же модель-заглушку
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': google('gemini-2.5-flash-preview-05-20'),
        'chat-model-reasoning': google('gemini-2.0-flash'),
        'title-model': google('gemini-2.0-flash'),
        'artifact-model': google('gemini-2.5-flash-preview-05-20'),
        'omni-image-model': google('gemini-2.0-flash-preview-image-generation'), // Наша новая модель
      },
      imageModels: {
        // Эта секция больше не используется для генерации, но может остаться для других целей
        'small-model': xai.image('grok-2-image'),
      },
    });

// END OF: lib/ai/providers.ts
