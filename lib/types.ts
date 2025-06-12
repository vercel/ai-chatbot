/**
 * @file lib/types.ts
 * @description Общие типы данных для всего приложения.
 * @version 1.2.0
 * @date 2025-06-12
 * @updated Добавлен тип сайта в artifactKinds.
 */

/** HISTORY:
 * v1.2.0 (2025-06-12): Добавлен тип 'site' в artifactKinds.
 * v1.1.0 (2025-06-10): Добавлены ArtifactKind и artifactKinds.
 * v1.0.0 (2025-06-06): Создан файл и добавлен тип VisibilityType.
 */

export type DataPart = { type: 'append-message'; message: string };

export type VisibilityType = 'public' | 'private';

// Определения, связанные с артефактами, вынесены сюда для общего доступа
// как для сервера, так и для клиента.
export const artifactKinds = ['text', 'code', 'image', 'sheet', 'site'] as const
export type ArtifactKind = (typeof artifactKinds)[number];

// END OF: lib/types.ts