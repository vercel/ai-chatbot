import { MultimodalInput } from './multimodal-input';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof MultimodalInput> = {
  component: MultimodalInput,
  title: 'Input/MultimodalInput',
};
export default meta;

export const Default: StoryObj<typeof MultimodalInput> = {
  args: {},
};