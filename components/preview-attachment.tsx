import type { Attachment } from '@/lib/types';
import { Loader } from './elements/loader';
import { CrossSmallIcon, PaperclipIcon } from './icons';
import { Button } from './ui/button';
import Image from 'next/image';
import { XIcon } from 'lucide-react';

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
  onRemove,
  onEdit,
}: {
  attachment: Attachment;
  isUploading?: boolean;
  onRemove?: () => void;
  onEdit?: () => void;
}) => {
  const { name, url, contentType } = attachment;

  return (
    <div
      data-testid="input-attachment-preview"
      className="group relative size-14 rounded-md border bg-muted"
    >
      {contentType?.startsWith('image') ? (
        <img
          key={url}
          src={url}
          alt={name ?? 'An image attachment'}
          className="rounded-md size-full object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground text-xs">
          <PaperclipIcon className="size-4" />
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader size={16} />
        </div>
      )}

      {onRemove && !isUploading && (
        <Button
          aria-label="Remove attachment"
          className="-right-1.5 -top-1.5 absolute h-6 w-6 rounded-full opacity-0 group-hover:opacity-100"
          onClick={onRemove}
          size="icon"
          type="button"
          variant="outline"
        >
          <XIcon className="h-3 w-3" />
        </Button>
      )}

      <div className="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/80 to-transparent px-1 py-0.5 text-[10px] text-white">
        {name}
      </div>
    </div>
  );
};
