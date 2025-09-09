import type { Attachment } from '@/lib/types';
import { Loader } from './elements/loader';
import { CrossSmallIcon } from './icons';
import { Button } from './ui/button';

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
      className="group relative h-16 w-16 overflow-hidden rounded-lg border bg-muted"
    >
      {contentType?.startsWith('image') ? (
        <img
          src={url}
          alt={name ?? 'An image attachment'}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
          File
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader size={16} />
        </div>
      )}

      {onRemove && !isUploading && (
        <Button
          onClick={onRemove}
          size="sm"
          variant="destructive"
          className="absolute top-0.5 right-0.5 size-4 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <CrossSmallIcon size={8} />
        </Button>
      )}

      <div className="absolute right-0 bottom-0 left-0 truncate bg-linear-to-t from-black/80 to-transparent px-1 py-0.5 text-[10px] text-white">
        {name}
      </div>
    </div>
  );
};
