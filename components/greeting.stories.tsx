import { Greeting } from './greeting';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Greeting> = {
  component: Greeting,
  title: 'UI/Greeting',
};
export default meta;

export const Default: StoryObj<typeof Greeting> = {
  args: {},
};