import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ModelSelector } from './model-selector';
import type { Session } from 'next-auth';

// Mock session
const mockSession: Session = {
  user: {
    id: '1',
    email: 'test@example.com',
    type: 'regular',
  },
  expires: '2024-12-31',
};

const meta: Meta<typeof ModelSelector> = {
  title: 'Components/ModelSelector',
  component: ModelSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Model selector component for choosing AI models based on user entitlements.',
      },
    },
  },
  argTypes: {
    selectedModelId: {
      control: 'select',
      options: ['gpt-4', 'claude-3', 'grok', 'gpt-3.5-turbo'],
      description: 'Currently selected model ID',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ModelSelector>;

export const Default: Story = {
  args: {
    session: mockSession,
    selectedModelId: 'gpt-4',
  },
};

export const WithGPT4: Story = {
  args: {
    session: mockSession,
    selectedModelId: 'gpt-4',
  },
};

export const WithClaude: Story = {
  args: {
    session: mockSession,
    selectedModelId: 'claude-3',
  },
};

export const WithGrok: Story = {
  args: {
    session: mockSession,
    selectedModelId: 'grok',
  },
};

export const GuestUser: Story = {
  args: {
    session: {
      ...mockSession,
      user: {
        ...mockSession.user,
        type: 'guest',
      },
    },
    selectedModelId: 'gpt-3.5-turbo',
  },
};

export const InToolbar: Story = {
  render: (args) => (
    <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
      <span className="text-sm font-medium">AI Model:</span>
      <ModelSelector {...args} />
    </div>
  ),
  args: {
    session: mockSession,
    selectedModelId: 'gpt-4',
  },
};