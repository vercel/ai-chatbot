import { SubmitButton } from './submit-button';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof SubmitButton> = {
  component: SubmitButton,
  title: 'UI/SubmitButton',
  argTypes: {
    isSuccessful: {
      control: 'boolean',
      description: 'Shows success state',
    },
  },
};
export default meta;

export const Default: StoryObj<typeof SubmitButton> = {
  args: {
    children: 'Submit',
    isSuccessful: false,
  },
};

export const Successful: StoryObj<typeof SubmitButton> = {
  args: {
    children: 'Submitted!',
    isSuccessful: true,
  },
};