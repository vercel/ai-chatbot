import type { Attachment } from '@/lib/types';
import { Loader } from './ai-elements/loader';
import { CrossSmallIcon } from './icons';
import { Button } from './ui/button';
import Image from 'next/image';

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
      className="overflow-hidden relative rounded-lg border group size-16 bg-muted"
    >
      {contentType?.startsWith('image') ? (
        <Image
          src={url}
          alt={name ?? 'An image attachment'}
          className="object-cover size-full"
          width={64}
          height={64}
        />
      ) : (
        <div className="flex justify-center items-center text-xs size-full text-muted-foreground">
          File
        </div>
      )}

      {isUploading && (
        <div className="flex absolute inset-0 justify-center items-center bg-black/50">
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

      <div className="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/80 to-transparent px-1 py-0.5 text-[10px] text-white">
        {name}
      </div>
    </div>
  );
};
