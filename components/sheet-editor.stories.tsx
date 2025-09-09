import { SheetEditor } from './sheet-editor';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof SheetEditor> = {
  component: SheetEditor,
  title: 'Editors/SheetEditor',
};
export default meta;

export const Default: StoryObj<typeof SheetEditor> = {
  args: {},
};