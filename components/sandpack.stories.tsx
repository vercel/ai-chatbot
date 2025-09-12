import { SandpackPreview } from './sandpack';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof SandpackPreview> = {
  title: 'Integrations/Sandpack',
  component: SandpackPreview,
};
export default meta;

export const Default: StoryObj<typeof SandpackPreview> = {};
