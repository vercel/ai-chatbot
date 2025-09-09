import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Artifact } from './artifact';
import type { ChatMessage } from '@/lib/types';
import type { Vote } from '@/lib/db/schema';
import type { VisibilityType } from './visibility-selector';

// Mock data
const mockMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    parts: [{ type: 'text', text: 'Create a solar panel analysis document' }],
  },
];

const mockVotes: Vote[] = [];

const meta: Meta<typeof Artifact> = {
  title: 'Components/Artifact',
  component: Artifact,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Artifact component for displaying and editing documents in chat.',
      },
    },
  },
  argTypes: {
    chatId: {
      control: 'text',
      description: 'ID of the chat this artifact belongs to',
    },
    input: {
      control: 'text',
      description: 'Current input text',
    },
    isReadonly: {
      control: 'boolean',
      description: 'Whether the artifact is in read-only mode',
    },
    selectedVisibilityType: {
      control: 'select',
      options: ['public', 'private'],
      description: 'Visibility setting for the artifact',
    },
    selectedModelId: {
      control: 'text',
      description: 'ID of the selected AI model',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Artifact>;

export const Default: Story = {
  args: {
    chatId: 'chat-1',
    input: '',
    setInput: () => {},
    status: 'ready',
    stop: async () => {},
    attachments: [],
    setAttachments: () => {},
    sendMessage: async () => {},
    messages: mockMessages,
    setMessages: () => {},
    regenerate: async () => {},
    votes: mockVotes,
    isReadonly: false,
    selectedVisibilityType: 'private' as VisibilityType,
    selectedModelId: 'gpt-4',
  },
};

export const ReadOnly: Story = {
  args: {
    ...Default.args,
    isReadonly: true,
  },
};

export const WithInput: Story = {
  args: {
    ...Default.args,
    input: 'Update the solar analysis with new data',
  },
};

export const PublicVisibility: Story = {
  args: {
    ...Default.args,
    selectedVisibilityType: 'public' as VisibilityType,
  },
};

export const WithVotes: Story = {
  args: {
    ...Default.args,
    votes: [
      {
        chatId: 'chat-1',
        messageId: '1',
        isUpvoted: true,
      },
    ],
  },
};