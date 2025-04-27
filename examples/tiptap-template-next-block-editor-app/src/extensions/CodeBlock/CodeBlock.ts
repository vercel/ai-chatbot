import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'

const lowlight = createLowlight(all)

export const CodeBlock = CodeBlockLowlight.configure({
  lowlight,
  defaultLanguage: 'javascript',
})
