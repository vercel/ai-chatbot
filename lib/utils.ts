/**
 * @file lib/utils.ts
 * @description Общие утилиты для проекта.
 * @version 1.1.0
 * @date 2025-06-09
 * @updated Переход на тип `Artifact` вместо `Document`.
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Artifact } from '@/lib/db/schema' // Изменено
import { ChatSDKError, type ErrorCode } from './errors'

export function cn (...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const { code, cause } = await response.json()
    throw new ChatSDKError(code as ErrorCode, cause)
  }
  return response.json()
}

export async function fetchWithErrorHandlers (input: RequestInfo | URL, init?: RequestInit) {
  try {
    const response = await fetch(input, init)
    if (!response.ok) {
      const { code, cause } = await response.json()
      throw new ChatSDKError(code as ErrorCode, cause)
    }
    return response
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat')
    }
    throw error
  }
}

export function generateUUID (): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getArtifactTimestampByIndex (
  artifacts: Array<Artifact>, // Изменено
  index: number,
) {
  if (!artifacts || index >= artifacts.length) return new Date()
  return artifacts[index].createdAt
}

export function sanitizeText (text: string) {
  return text.replace('<has_function_call>', '')
}
