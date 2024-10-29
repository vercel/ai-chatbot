import { SetStateAction } from 'react';

import { UICanvas } from './canvas';
import { FileIcon, LoaderIcon, MessageIcon, PencilEditIcon } from './icons';

const getActionText = (type: 'create' | 'update' | 'request-suggestions') => {
  switch (type) {
    case 'create':
      return 'Creating';
    case 'update':
      return 'Updating';
    case 'request-suggestions':
      return 'Adding suggestions to';
    default:
      return null;
  }
};

interface DocumentToolResultProps {
  type: 'create' | 'update' | 'request-suggestions';
  result: any;
  canvas: UICanvas | null;
  setCanvas: (value: SetStateAction<UICanvas | null>) => void;
}

export function DocumentToolResult({
  type,
  result,
  canvas,
  setCanvas,
}: DocumentToolResultProps) {
  return (
    <div
      className="cursor-pointer border py-2 px-3 rounded-xl w-fit flex flex-row gap-3 items-start"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();

        const boundingBox = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };

        if (!canvas) {
          setCanvas({
            documentId: result.id,
            content: '',
            title: result.title,
            isVisible: true,
            status: 'idle',
            boundingBox,
          });
        } else {
          if (canvas.documentId !== result.id) {
            setCanvas({
              documentId: result.id,
              content: '',
              title: result.title,
              isVisible: true,
              status: 'idle',
              boundingBox,
            });
          }
        }
      }}
    >
      <div className="text-muted-foreground mt-1">
        {type === 'create' ? (
          <FileIcon />
        ) : type === 'update' ? (
          <PencilEditIcon />
        ) : type === 'request-suggestions' ? (
          <MessageIcon />
        ) : null}
      </div>
      <div className="">
        {getActionText(type)} {result.title}
      </div>
    </div>
  );
}

interface DocumentToolCallProps {
  type: 'create' | 'update' | 'request-suggestions';
  args: any;
}

export function DocumentToolCall({ type, args }: DocumentToolCallProps) {
  return (
    <div className="w-fit border p-2 rounded-xl flex flex-row items-center justify-between gap-2">
      <div className="flex flex-row gap-2 items-center">
        <div className="text-zinc-500">
          {type === 'create' ? (
            <FileIcon />
          ) : type === 'update' ? (
            <PencilEditIcon />
          ) : type === 'request-suggestions' ? (
            <MessageIcon />
          ) : null}
        </div>

        <div className="">
          {getActionText(type)} {args.title}
        </div>
      </div>

      <div className="animate-spin">{<LoaderIcon />}</div>
    </div>
  );
}
