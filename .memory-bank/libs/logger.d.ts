/**
 * @file src/logger/logger.d.ts
 * @description TypeScript декларации для основного модуля логирования (@fab33/sys-logger).
 * @version 0.8.4
 */

// Импортируем типы из зависимостей, если они есть и предоставляют типы.
// Замените 'any' на конкретный тип, если @fab33/sys-errors экспортирует SystemError как тип.
type SystemError = any; // Или: import { SystemError } from '@fab33/sys-errors';

/**
 * @type {string}
 * @description Допустимые уровни логирования.
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * @type {object}
 * @description Объект с данными для логирования (bindings). Ключи - строки, значения - любые.
 */
export type LogBindings = Record<string, any>;

/**
 * @interface Logger
 * @description Интерфейс для экземпляра логгера, возвращаемого createLogger.
 * Предоставляет методы для логирования на разных уровнях и утилиты для управления логгером.
 */
export interface Logger {
  /**
   * @property {LogLevel} level
   * Позволяет получить или установить минимальный уровень логирования для данного экземпляра логгера.
   * Изменение уровня влияет на этот логгер и на дочерние, созданные *после* изменения.
   * При установке используется строковое имя уровня ('trace', 'debug', etc.).
   */
  level: LogLevel;

  /**
   * Логирует сообщение на уровне 'trace'.
   * @param {string} message Форматная строка сообщения (printf-style).
   * @param {...any} args Аргументы для подстановки в форматную строку.
   */
  trace (message: string, ...args: any[]): void;

  /**
   * Логирует объект и опциональное сообщение на уровне 'trace'.
   * @param {LogBindings} obj Объект с метаданными для лога.
   * @param {string} [message] Опциональная форматная строка сообщения (printf-style).
   * @param {...any} args Аргументы для подстановки в форматную строку.
   */
  trace (obj: LogBindings, message?: string, ...args: any[]): void;

  /**
   * Логирует сообщение на уровне 'debug'.
   * @param {string} message Форматная строка сообщения (printf-style).
   * @param {...any} args Аргументы для подстановки в форматную строку.
   */
  debug (message: string, ...args: any[]): void;

  /**
   * Логирует объект и опциональное сообщение на уровне 'debug'.
   * @param {LogBindings} obj Объект с метаданными для лога.
   * @param {string} [message] Опциональная форматная строка сообщения (printf-style).
   * @param {...any} args Аргументы для подстановки в форматную строку.
   */
  debug (obj: LogBindings, message?: string, ...args: any[]): void;

  /**
   * Логирует сообщение на уровне 'info'.
   * @param {string} message Форматная строка сообщения (printf-style).
   * @param {...any} args Аргументы для подстановки в форматную строку.
   */
  info (message: string, ...args: any[]): void;

  /**
   * Логирует объект и опциональное сообщение на уровне 'info'.
   * @param {LogBindings} obj Объект с метаданными для лога.
   * @param {string} [message] Опциональная форматная строка сообщения (printf-style).
   * @param {...any} args Аргументы для подстановки в форматную строку.
   */
  info (obj: LogBindings, message?: string, ...args: any[]): void;

  /**
   * Логирует сообщение на уровне 'warn'.
   * @param {string} message Форматная строка сообщения (printf-style).
   * @param {...any} args Аргументы для подстановки в форматную строку.
   */
  warn (message: string, ...args: any[]): void;

  /**
   * Логирует объект и опциональное сообщение на уровне 'warn'.
   * @param {LogBindings} obj Объект с метаданными для лога.
   * @param {string} [message] Опциональная форматная строка сообщения (printf-style).
   * @param {...any} args Аргументы для подстановки в форматную строку.
   */
  warn (obj: LogBindings, message?: string, ...args: any[]): void;

  /**
   * Логирует сообщение на уровне 'error'.
   * @param {string} message Форматная строка сообщения (printf-style).
   * @param {...any} args Аргументы для подстановки в форматную строку.
   */
  error (message: string, ...args: any[]): void;

  /**
   * Логирует объект ошибки и опциональное сообщение на уровне 'error'.
   * Ошибка будет автоматически помещена в поле 'err'.
   * @param {Error} error Объект ошибки.
   * @param {string} [message] Опциональная форматная строка сообщения (printf-style).
   * @param {...any} args Аргументы для подстановки в форматную строку.
   */
  error (error: Error, message?: string, ...args: any[]): void;

  /**
   * Логирует объект (возможно, содержащий ошибку в поле 'err') и опциональное сообщение на уровне 'error'.
   * @param {LogBindings & { err?: Error }} obj Объект с метаданными для лога. Поле 'err' будет обработано особо.
   * @param {string} [message] Опциональная форматная строка сообщения (printf-style).
   * @param {...any} args Аргументы для подстановки в форматную строку.
   */
  error (obj: LogBindings & { err?: Error }, message?: string, ...args: any[]): void;

  /**
   * Логирует сообщение на уровне 'fatal'.
   * @param {string} message Форматная строка сообщения (printf-style).
   * @param {...any} args Аргументы для подстановки в форматную строку.
   */
  fatal (message: string, ...args: any[]): void;

  /**
   * Логирует объект ошибки и опциональное сообщение на уровне 'fatal'.
   * Ошибка будет автоматически помещена в поле 'err'.
   * @param {Error} error Объект ошибки.
   * @param {string} [message] Опциональная форматная строка сообщения (printf-style).
   * @param {...any} args Аргументы для подстановки в форматную строку.
   */
  fatal (error: Error, message?: string, ...args: any[]): void;

  /**
   * Логирует объект (возможно, содержащий ошибку в поле 'err') и опциональное сообщение на уровне 'fatal'.
   * @param {LogBindings & { err?: Error }} obj Объект с метаданными для лога. Поле 'err' будет обработано особо.
   * @param {string} [message] Опциональная форматная строка сообщения (printf-style).
   * @param {...any} args Аргументы для подстановки в форматную строку.
   */
  fatal (obj: LogBindings & { err?: Error }, message?: string, ...args: any[]): void;

  /**
   * Создает новый экземпляр дочернего логгера.
   * Наследует конфигурацию родителя и добавляет указанные bindings ко всем своим лог-сообщениям.
   * Фильтрация по DEBUG все еще основана на namespace родительского логгера.
   * @param {LogBindings} bindings Объект с ключ-значение парами для добавления в контекст.
   * @returns {Logger} Новый экземпляр дочернего логгера.
   */
  child (bindings: LogBindings): Logger;

  /**
   * Возвращает объект, содержащий все bindings (контекст), активные для данного экземпляра логгера.
   * Включает `namespace` (если был задан при создании) и все bindings, добавленные через `.child()`.
   * @returns {LogBindings} Объект с текущими bindings.
   */
  bindings (): LogBindings;

  /**
   * Проверяет, будут ли сообщения с указанным уровнем записаны этим экземпляром логгера.
   * Учитывает текущий `logger.level` и фильтр `DEBUG` (на основе namespace логгера).
   * Полезно для предотвращения вычисления ресурсоемких данных для неактивных уровней логов.
   * @param {LogLevel} levelName Имя уровня для проверки ('trace', 'debug', etc.).
   * @returns {boolean} true, если данный уровень логирования активен для этого логгера, иначе false.
   */
  isLevelEnabled (levelName: LogLevel): boolean;

  /**
   * Временно полностью отключает вывод для данного экземпляра логгера и его дочерних элементов.
   * Соответствует вызову `pinoInstance.silent()`.
   */
  silent (): void;
}

/**
 * Создает экземпляр логгера с возможностью фильтрации по namespace и расширенным API.
 * @param {string} [namespace] - Необязательный идентификатор (namespace) для этого логгера. Используется для фильтрации вывода через переменную окружения `DEBUG`.
 *                               Логгеры без namespace активны только если `DEBUG` не задан, пуст, или содержит `*` без явного запрета.
 * @returns {Logger} Объект логгера с методами `trace`, `debug`, `info`, `warn`, `error`, `fatal`, `child`, `bindings`, `isLevelEnabled`, `silent` и свойством `level`.
 * @throws {SystemError} Бросает ошибку `TRANSPORT_INIT_FAILED`, если не удалось инициализировать базовый логгер или его транспорты (например, из-за ошибки конфигурации или прав доступа к файлам).
 */
export function createLogger (namespace?: string): Logger;

/**
 * @const {LogLevel[]}
 * @description Массив строк с именами поддерживаемых уровней логирования в порядке возрастания важности.
 */
export const LOG_LEVELS: LogLevel[]