import { Block } from '@/components/create-block';
import { CodeEditor } from '@/components/code-editor';

export const codeBlock = new Block({
  kind: 'code',
  description:
    'Useful for code generation; Code execution is only available for python code.',
  content: CodeEditor,
  actions: [
    {
      name: 'copy-to-clipboard',
      description: 'Copy code to clipboard',
    },
  ],
  toolbar: [
    {
      name: 'add-logs',
    },
  ],
});
