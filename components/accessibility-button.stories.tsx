import { AccessibilityButton } from './accessibility-button';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof AccessibilityButton> = {
  component: AccessibilityButton,
  title: 'UI/AccessibilityButton',
};
export default meta;

export const Default: StoryObj<typeof AccessibilityButton> = {
  args: {},
};
