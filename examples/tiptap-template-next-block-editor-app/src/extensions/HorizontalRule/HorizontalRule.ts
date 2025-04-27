import { mergeAttributes } from '@tiptap/core'
import TiptapHorizontalRule from '@tiptap/extension-horizontal-rule'

export const HorizontalRule = TiptapHorizontalRule.extend({
  renderHTML() {
    return ['div', mergeAttributes(this.options.HTMLAttributes, { 'data-type': this.name }), ['hr']]
  },
})

export default HorizontalRule
