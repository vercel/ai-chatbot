/**
 * @file artifacts/image/client.tsx
 * @description Клиентская часть для артефакта типа "изображение".
 * @version 1.1.0
 * @date 2025-06-07
 * @updated Добавлены кнопки и логика для работы с версиями (аналогично текстовому редактору).
 */

/** HISTORY:
 * v1.1.0 (2025-06-07): Внедрены действия для версионирования.
 * v1.0.0 (2025-06-07): Начальная версия.
 */

import { Artifact } from '@/components/create-artifact';
import { ClockRewind, CopyIcon, RedoIcon, UndoIcon } from '@/components/icons';
import { ImageEditor } from '@/components/image-editor';
import { toast } from 'sonner';

export const imageArtifact = new Artifact({
  kind: 'image',
  description: 'Useful for image generation and editing',
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === 'image-delta') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.content as string,
        isVisible: true,
        status: 'streaming',
      }));
    }
  },
  content: ImageEditor,
  actions: [
    {
      icon: <ClockRewind size={18} />,
      description: 'View changes',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('toggle');
      },
      isDisabled: ({ currentVersionIndex, setMetadata }) => {
        if (currentVersionIndex === 0) {
          return true;
        }
        return false;
      },
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
      description: 'Copy image to clipboard',
      onClick: async ({ content }) => {
        try {
          const response = await fetch(content);
          const blob = await response.blob();
          await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob }),
          ]);
          toast.success('Image copied to clipboard!');
        } catch (error) {
          console.error('Failed to copy image:', error);
          toast.error('Failed to copy image to clipboard.');
        }
      },
    },
  ],
  toolbar: [],
});

// END OF: artifacts/image/client.tsx
