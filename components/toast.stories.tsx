import { Toast } from './toast';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof Toast> = {
  component: Toast,
  title: 'Feedback/Toast',
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'success'],
      description: 'Toast variant',
    },
  },
};
export default meta;

export const Default: StoryObj<typeof Toast> = {
  args: {
    title: 'Success!',
    description: 'Operation completed successfully.',
  },
};

export const Destructive: StoryObj<typeof Toast> = {
  args: {
    title: 'Error!',
    description: 'Something went wrong.',
    variant: 'destructive',
  },
};

export const Success: StoryObj<typeof Toast> = {
  args: {
    title: 'Success!',
    description: 'Your changes have been saved.',
    variant: 'success',
  },
};