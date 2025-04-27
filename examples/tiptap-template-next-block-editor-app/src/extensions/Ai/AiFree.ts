// This is a dummy file, to make the project work without the AI extension.
import { Extension } from '@tiptap/core'

export type AiStorage = any
export type Language = any
export const tryParseToTiptapHTML = (args: any) => args
export const Ai = Extension.create({
  name: 'aiFree',
})
