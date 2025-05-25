'use client';

import { Artifact } from '@/components/create-artifact';
import { 
  CopyIcon, 
  RedoIcon, 
  UndoIcon, 
  FullscreenIcon,
  PlayIcon
} from '@/components/icons';
import { PresentationEditor } from '@/components/presentation-editor';
import { toast } from 'sonner';

// PauseIcon component
const PauseIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    style={{ color: 'currentcolor' }}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.5 2C4.22386 2 4 2.22386 4 2.5V13.5C4 13.7761 4.22386 14 4.5 14H6.5C6.77614 14 7 13.7761 7 13.5V2.5C7 2.22386 6.77614 2 6.5 2H4.5ZM9.5 2C9.22386 2 9 2.22386 9 2.5V13.5C9 13.7761 9.22386 14 9.5 14H11.5C11.7761 14 12 13.7761 12 13.5V2.5C12 2.22386 11.7761 2 11.5 2H9.5Z"
      fill="currentColor"
    />
  </svg>
);

export interface PresentationMetadata {
  currentSlide: number;
  isPresenting: boolean;
  totalSlides: number;
  theme: {
    name: string;
    primary: string;
    secondary: string;
    background: string;
    textColor: string;
    accent: string;
  };
}

export const presentationArtifact = new Artifact<'presentation', PresentationMetadata>({
  kind: 'presentation',
  description: 'Useful for creating slide presentations with navigation and media support',
  initialize: async ({ setMetadata }) => {
    setMetadata({
      currentSlide: 0,
      isPresenting: false,
      totalSlides: 1,
      theme: {
        name: 'Modern Blue',
        primary: '#2563eb',
        secondary: '#7c3aed',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        textColor: '#1f2937',
        accent: '#f59e0b',
      },
    });
  },
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === 'presentation-delta') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.content as string,
        isVisible:
          draftArtifact.status === 'streaming' &&
          draftArtifact.content.length > 200 &&
          draftArtifact.content.length < 250
            ? true
            : draftArtifact.isVisible,
        status: 'streaming',
      }));
    }
  },
  content: PresentationEditor,
  actions: [
    {
      icon: <PlayIcon size={18} />,
      label: 'Present',
      description: 'Start presentation mode',
      onClick: ({ metadata, setMetadata }) => {
        setMetadata({
          ...metadata,
          isPresenting: true,
        });
      },
      isDisabled: ({ metadata }) => metadata?.isPresenting || false,
    },
    {
      icon: <PauseIcon size={18} />,
      label: 'Exit',
      description: 'Exit presentation mode',
      onClick: ({ metadata, setMetadata }) => {
        setMetadata({
          ...metadata,
          isPresenting: false,
        });
      },
      isDisabled: ({ metadata }) => !metadata?.isPresenting,
    },
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy presentation content',
      onClick: async ({ content }) => {
        try {
          await navigator.clipboard.writeText(content);
          toast.success('Presentation content copied to clipboard');
        } catch (error) {
          toast.error('Failed to copy to clipboard');
        }
      },
    },
  ],
  toolbar: [
    {
      description: 'Add property listings',
      icon: <span>🏠</span>,
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Add some real estate property listings to this presentation with their images and details.',
        });
      },
    },
    {
      description: 'Create market overview',
      icon: <span>📊</span>,
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Create a market overview slide showing property statistics and pricing trends from the listings data.',
        });
      },
    },
    {
      description: 'Customize theme colors',
      icon: <span>🎨</span>,
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Can you update this presentation with a new color theme? Make it more visually appealing.',
        });
      },
    },
    {
      description: 'Add more slides',
      icon: <span>📝</span>,
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Can you add more slides to this presentation?',
        });
      },
    },
    {
      description: 'Add images and media',
      icon: <span>🖼️</span>,
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Can you add relevant images and media to enhance this presentation?',
        });
      },
    },
    {
      description: 'Change layout style',
      icon: <span>📐</span>,
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Can you improve the layout and visual design of this presentation?',
        });
      },
    },
  ],
}); 