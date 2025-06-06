/**
 * @file lib/types.ts
 * @description Общие типы данных для всего приложения.
 * @version 1.0.0
 * @date 2025-06-06
 * @updated Добавлен тип VisibilityType.
 */

/** HISTORY:
 * v1.0.0 (2025-06-06): Создан файл и добавлен тип VisibilityType.
 */

export type DataPart = { type: 'append-message'; message: string };

export type VisibilityType = 'public' | 'private';

// END OF: lib/types.ts