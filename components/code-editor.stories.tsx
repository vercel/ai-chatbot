import { CodeEditor } from './code-editor';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof CodeEditor> = {
  component: CodeEditor,
  title: 'Editors/CodeEditor',
  argTypes: {
    language: {
      control: 'select',
      options: ['javascript', 'typescript', 'python', 'json'],
      description: 'Programming language',
    },
  },
};
export default meta;

export const Default: StoryObj<typeof CodeEditor> = {
  args: {
    language: 'typescript',
  },
};

export const JavaScript: StoryObj<typeof CodeEditor> = {
  args: {
    language: 'javascript',
  },
};

export const Python: StoryObj<typeof CodeEditor> = {
  args: {
    language: 'python',
  },
};
