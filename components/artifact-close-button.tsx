import { memo } from 'react';
import { CrossIcon } from './icons';
import { Button } from './ui/button';
import { useDocumentLayout } from '@/hooks/use-document-layout';

function PureArtifactCloseButton() {
  const { setDocumentLayout } = useDocumentLayout();

  return (
    <Button
      data-testid="artifact-close-button"
      variant="outline"
      className="h-fit p-2 dark:hover:bg-zinc-700"
      onClick={() => {
        setDocumentLayout((documentLayout) => ({
          ...documentLayout,
          selectedDocumentId: null,
          isVisible: false,
        }));
      }}
    >
      <CrossIcon size={18} />
    </Button>
  );
}

export const ArtifactCloseButton = memo(PureArtifactCloseButton, () => true);
