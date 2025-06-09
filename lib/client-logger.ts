/**
 * @file lib/client-logger.ts
 * @description Утилита для логирования на стороне клиента с API, похожим на pino.
 * @version 1.1.0
 * @date 2025-06-09
 */

/** HISTORY:
 * v1.1.0 (2025-06-09): Добавлен метод `trace` для соответствия с серверным API и исправления ошибок типов.
 * v1.0.0 (2025-06-09): Начальная версия с поддержкой namespace и child-логгеров.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'trace';
type Bindings = Record<string, any>;

const log = (level: LogLevel, namespace: string, bindings: Bindings, ...args: any[]) => {
  if (process.env.NODE_ENV !== 'development') {
    return
  }
  // 'trace' и 'debug' будут использовать console.debug для лучшей фильтрации в DevTools
  const logMethod = level === 'info' ? 'log' : level === 'warn' ? 'warn' : level === 'error' ? 'error' : 'debug'

  const timestamp = new Date().toLocaleTimeString()
  const formattedBindings = Object.entries(bindings).length > 0 ? [bindings] : []

  console[logMethod](
    `[${timestamp}] [UI:${namespace}]`,
    ...formattedBindings,
    ...args
  )
}

export interface ClientLogger {
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  trace: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  child: (bindings: Bindings) => ClientLogger;
}

export const createClientLogger = (namespace: string, parentBindings: Bindings = {}): ClientLogger => {
  const currentBindings = { ...parentBindings }

  return {
    info: (...args: any[]) => log('info', namespace, currentBindings, ...args),
    debug: (...args: any[]) => log('debug', namespace, currentBindings, ...args),
    trace: (...args: any[]) => log('trace', namespace, currentBindings, ...args),
    warn: (...args: any[]) => log('warn', namespace, currentBindings, ...args),
    error: (...args: any[]) => log('error', namespace, currentBindings, ...args),

    child: (childBindings: Bindings): ClientLogger => {
      const newBindings = { ...currentBindings, ...childBindings }
      return createClientLogger(namespace, newBindings)
    },
  }
}

// END OF: lib/client-logger.ts
