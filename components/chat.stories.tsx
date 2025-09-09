import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Chat } from './chat';
import type { ChatMessage } from '@/lib/types';
import type { VisibilityType } from './visibility-selector';
import type { Session } from 'next-auth';

// Mock data
const mockSession: Session = {
  user: {
    id: '1',
    email: 'test@example.com',
    type: 'regular',
  },
  expires: '2024-12-31',
};

const mockMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    parts: [{ type: 'text', text: 'Hello, I need help with solar panels' }],
  },
  {
    id: '2',
    role: 'assistant',
    parts: [{ type: 'text', text: 'I can help you with solar panel information. What would you like to know?' }],
  },
];

const meta: Meta<typeof Chat> = {
  title: 'Components/Chat',
  component: Chat,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Main chat component for AI conversations with solar energy focus.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="h-screen w-full">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    id: {
      control: 'text',
      description: 'Unique identifier for the chat session',
    },
    initialChatModel: {
      control: 'select',
      options: ['gpt-4', 'claude-3', 'grok'],
      description: 'Initial AI model to use',
    },
    initialVisibilityType: {
      control: 'select',
      options: ['public', 'private'],
      description: 'Visibility setting for the chat',
    },
    isReadonly: {
      control: 'boolean',
      description: 'Whether the chat is in read-only mode',
    },
    autoResume: {
      control: 'boolean',
      description: 'Whether to auto-resume interrupted conversations',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Chat>;

export const Default: Story = {
  args: {
    id: 'chat-1',
    initialMessages: mockMessages,
    initialChatModel: 'gpt-4',
    initialVisibilityType: 'private' as VisibilityType,
    isReadonly: false,
    session: mockSession,
    autoResume: true,
  },
};

export const ReadOnly: Story = {
  args: {
    ...Default.args,
    isReadonly: true,
  },
};

export const Empty: Story = {
  args: {
    ...Default.args,
    initialMessages: [],
  },
};

export const WithLongConversation: Story = {
  args: {
    ...Default.args,
    initialMessages: Array.from({ length: 20 }, (_, i) => ({
      id: `msg-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      parts: [{ type: 'text', text: `Message ${i + 1}: ${i % 2 === 0 ? 'User question about solar panels' : 'AI response with detailed information'}` }],
    })),
  },
};

export const PublicVisibility: Story = {
  args: {
    ...Default.args,
    initialVisibilityType: 'public' as VisibilityType,
  },
};