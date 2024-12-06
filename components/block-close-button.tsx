import { memo, type SetStateAction } from 'react';
import { CrossIcon } from './icons';
import { Button } from './ui/button';
import type { UIBlock } from './block';

interface BlockCloseButtonProps {
  setBlock: (value: SetStateAction<UIBlock>) => void;
}

function PureBlockCloseButton({ setBlock }: BlockCloseButtonProps) {
  return (
    <Button
      variant="outline"
      className="h-fit p-2 dark:hover:bg-zinc-700"
      onClick={() => {
        setBlock((currentBlock) => ({
          ...currentBlock,
          isVisible: false,
        }));
      }}
    >
      <CrossIcon size={18} />
    </Button>
  );
}

export const BlockCloseButton = memo(PureBlockCloseButton, () => true);
