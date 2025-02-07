import type { Attachment } from 'ai';
import { X } from 'lucide-react';

import { LoaderIcon } from './icons';
import { Button } from './ui/button';

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
  onDelete,
}: {
  attachment: Attachment;
  isUploading?: boolean;
  onDelete?: (attachment: Attachment) => void;
}) => {
  const { name, url, contentType } = attachment;

  return (
    <div className="flex flex-col gap-2">
      <div className="w-20 h-16 aspect-video bg-muted rounded-md relative flex flex-col items-center justify-center">
        {contentType ? (
          contentType.startsWith('image') ? (
            // NOTE: it is recommended to use next/image for images
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={name ?? 'An image attachment'}
              className="rounded-md size-full object-cover"
            />
          ) : (
            <div className="" />
          )
        ) : (
          <div className="" />
        )}

        {isUploading && (
          <div className="animate-spin absolute text-zinc-500">
            <LoaderIcon />
          </div>
        )}

        {onDelete && (
          <Button
            variant="outline"
            onClick={() => onDelete(attachment)}
            className="absolute -right-2 -top-2 rounded-full bg-background border p-0.5 hover:bg-muted size-6"
          >
            <X size={24} />
          </Button>
        )}
      </div>
      <div
        title={name}
        className="text-sm texs text-zinc-500 max-w-16 truncate"
      >
        {name}
      </div>
    </div>
  );
};
