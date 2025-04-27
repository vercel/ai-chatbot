import AiExtension from '@tiptap-pro/extension-ai'
const TIPTAP_AI_APP_ID = process.env.NEXT_PUBLIC_TIPTAP_AI_APP_ID
const TIPTAP_AI_BASE_URL = process.env.NEXT_PUBLIC_TIPTAP_AI_BASE_URL || 'https://api.tiptap.dev/v1/ai'

export type { AiStorage, Language } from '@tiptap-pro/extension-ai'
export { tryParseToTiptapHTML } from '@tiptap-pro/extension-ai'
export const Ai = AiExtension.configure({
  appId: TIPTAP_AI_APP_ID,
  baseUrl: TIPTAP_AI_BASE_URL,
  autocompletion: true,
})
