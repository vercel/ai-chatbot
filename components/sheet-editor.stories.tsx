import { SheetEditor } from './sheet-editor';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof SheetEditor> = {
  component: SheetEditor,
  title: 'Editors/SheetEditor',
};
export default meta;

export const Default: StoryObj<typeof SheetEditor> = {
  args: {},
};