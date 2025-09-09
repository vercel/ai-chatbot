import { SkipLink } from './skip-link';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof SkipLink> = {
  component: SkipLink,
  title: 'Accessibility/SkipLink',
  argTypes: {
    mainId: {
      control: 'text',
      description: 'ID of the main content element',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};
export default meta;

export const Default: StoryObj<typeof SkipLink> = {
  args: {
    mainId: 'main-content',
  },
};

export const WithCustomClass: StoryObj<typeof SkipLink> = {
  args: {
    mainId: 'main-content',
    className: 'custom-skip-link',
  },
};