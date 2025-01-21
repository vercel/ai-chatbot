import { cn } from '@/lib/utils';
import { ClockRewind, CopyIcon, RedoIcon, UndoIcon } from './icons';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { toast } from 'sonner';
import { blockDefinitions, ConsoleOutput, UIBlock } from './block';
import { Dispatch, memo, SetStateAction } from 'react';
import { RunCodeButton } from './run-code-button';
import { useMultimodalCopyToClipboard } from '@/hooks/use-multimodal-copy-to-clipboard';
import { BlockActionContext } from './create-block';

interface BlockActionsProps {
  block: UIBlock;
  handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  mode: 'edit' | 'diff';
  setConsoleOutputs: Dispatch<SetStateAction<Array<ConsoleOutput>>>;
}

function PureBlockActions({
  block,
  handleVersionChange,
  currentVersionIndex,
  isCurrentVersion,
  mode,
  setConsoleOutputs,
}: BlockActionsProps) {
  const { copyTextToClipboard, copyImageToClipboard } =
    useMultimodalCopyToClipboard();

  const blockDefinition = blockDefinitions.find(
    (definition) => definition.kind === block.kind,
  );

  if (!blockDefinition) {
    throw new Error('Block definition not found!');
  }

  const actionContext: BlockActionContext = {
    content: block.content,
    handleVersionChange,
  };

  return (
    <div className="flex flex-row gap-1">
      {blockDefinition.actions.map((action) => (
        <Tooltip key={action.name}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="p-2 h-fit dark:hover:bg-zinc-700"
              onClick={() => action.onClick(actionContext)}
              disabled={block.status === 'streaming'}
            >
              {action.icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{action.description}</TooltipContent>
        </Tooltip>
      ))}

      {/* {block.kind === "code" && (
        <RunCodeButton block={block} setConsoleOutputs={setConsoleOutputs} />
      )} */}
    </div>
  );
}

export const BlockActions = memo(PureBlockActions, (prevProps, nextProps) => {
  if (prevProps.block.status !== nextProps.block.status) return false;
  if (prevProps.currentVersionIndex !== nextProps.currentVersionIndex)
    return false;
  if (prevProps.isCurrentVersion !== nextProps.isCurrentVersion) return false;

  return true;
});
