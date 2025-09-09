import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PreviewMessage } from './message';
import type { ChatMessage } from '@/lib/types';
import type { Vote } from '@/lib/db/schema';

// Mock data
const mockMessage: ChatMessage = {
  id: '1',
  role: 'assistant',
  parts: [{ type: 'text', text: 'This is a sample AI response about solar panels.' }],
};

const mockUserMessage: ChatMessage = {
  id: '2',
  role: 'user',
  parts: [{ type: 'text', text: 'Tell me about solar panel installation costs.' }],
};

const mockVote: Vote = {
  chatId: 'chat-1',
  messageId: '1',
  isUpvoted: true,
};

const mockChatHelpers = {
  setMessages: () => {},
  regenerate: async () => {},
};

const meta: Meta<typeof PreviewMessage> = {
  title: 'Components/Message',
  component: PreviewMessage,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Individual message component for chat conversations.',
      },
    },
  },
  argTypes: {
    chatId: {
      control: 'text',
      description: 'ID of the chat this message belongs to',
    },
    vote: {
      control: 'object',
      description: 'Vote status for the message',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the message is currently loading',
    },
    isReadonly: {
      control: 'boolean',
      description: 'Whether the chat is in read-only mode',
    },
    requiresScrollPadding: {
      control: 'boolean',
      description: 'Whether scroll padding is required',
    },
    isArtifactVisible: {
      control: 'boolean',
      description: 'Whether artifacts are visible',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PreviewMessage>;

export const AssistantMessage: Story = {
  args: {
    chatId: 'chat-1',
    message: mockMessage,
    vote: undefined,
    isLoading: false,
    setMessages: mockChatHelpers.setMessages,
    regenerate: mockChatHelpers.regenerate,
    isReadonly: false,
    requiresScrollPadding: false,
    isArtifactVisible: true,
  },
};

export const UserMessage: Story = {
  args: {
    ...AssistantMessage.args,
    message: mockUserMessage,
  },
};

export const LoadingMessage: Story = {
  args: {
    ...AssistantMessage.args,
    isLoading: true,
  },
};

export const VotedMessage: Story = {
  args: {
    ...AssistantMessage.args,
    vote: mockVote,
  },
};

export const ReadOnlyMessage: Story = {
  args: {
    ...AssistantMessage.args,
    isReadonly: true,
  },
};

export const WithScrollPadding: Story = {
  args: {
    ...AssistantMessage.args,
    requiresScrollPadding: true,
  },
};