import { PerformanceDashboard } from './performance-dashboard';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof PerformanceDashboard> = {
  component: PerformanceDashboard,
  title: 'Dashboard/PerformanceDashboard',
};
export default meta;

export const Default: StoryObj<typeof PerformanceDashboard> = {
  args: {},
};