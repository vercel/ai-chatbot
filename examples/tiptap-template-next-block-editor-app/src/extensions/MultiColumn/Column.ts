import { Node, mergeAttributes } from '@tiptap/core'

export const Column = Node.create({
  name: 'column',

  content: 'block+',

  isolating: true,

  addAttributes() {
    return {
      position: {
        default: '',
        parseHTML: element => element.getAttribute('data-position'),
        renderHTML: attributes => ({ 'data-position': attributes.position }),
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'column' }), 0]
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="column"]',
      },
    ]
  },
})

export default Column
