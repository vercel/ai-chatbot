"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type LogLevel = "log" | "error" | "warn" | "info";

export interface ConsoleLog {
  timestamp: Date;
  level: LogLevel;
  message: string;
  args: unknown[];
}

export function useConsoleLogs() {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const originalConsole = useRef<{
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
  }>();

  const addLog = useCallback((level: LogLevel, ...args: unknown[]) => {
    const message = args
      .map((arg) => {
        if (typeof arg === "string") {
          return arg;
        }
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      })
      .join(" ");

    setLogs((prev) => [
      ...prev,
      {
        timestamp: new Date(),
        level,
        message,
        args,
      },
    ]);
  }, []);

  useEffect(() => {
    // Store original console methods
    originalConsole.current = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
    };

    // Override console methods
    console.log = (...args: unknown[]) => {
      originalConsole.current?.log(...args);
      addLog("log", ...args);
    };

    console.error = (...args: unknown[]) => {
      originalConsole.current?.error(...args);
      addLog("error", ...args);
    };

    console.warn = (...args: unknown[]) => {
      originalConsole.current?.warn(...args);
      addLog("warn", ...args);
    };

    console.info = (...args: unknown[]) => {
      originalConsole.current?.info(...args);
      addLog("info", ...args);
    };

    // Restore original console methods on unmount
    return () => {
      if (originalConsole.current) {
        console.log = originalConsole.current.log;
        console.error = originalConsole.current.error;
        console.warn = originalConsole.current.warn;
        console.info = originalConsole.current.info;
      }
    };
  }, [addLog]);

  const formatLogsAsMarkdown = useCallback(() => {
    if (logs.length === 0) {
      return "No console logs captured.";
    }

    const markdown = logs
      .map((log) => {
        const time = log.timestamp.toISOString();
        const level = log.level.toUpperCase();
        const message = log.message
          .split("\n")
          .map((line) => `  ${line}`)
          .join("\n");

        return `[${time}] ${level}\n${message}`;
      })
      .join("\n\n");

    return `\`\`\`\n${markdown}\n\`\`\``;
  }, [logs]);

  const copyLogsToClipboard = useCallback(async () => {
    const markdown = formatLogsAsMarkdown();
    try {
      await navigator.clipboard.writeText(markdown);
      return true;
    } catch {
      return false;
    }
  }, [formatLogsAsMarkdown]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    logCount: logs.length,
    copyLogsToClipboard,
    clearLogs,
    formatLogsAsMarkdown,
  };
}




