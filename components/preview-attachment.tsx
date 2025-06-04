import type { Attachment } from 'ai';
import { LoaderIcon } from './icons';

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
  onCancel,
}: {
  attachment: Attachment;
  isUploading?: boolean;
  onCancel?: () => void;
}) => {
  const { name, url, contentType } = attachment;

  return (
    <div
      data-testid="input-attachment-preview"
      className="flex flex-col gap-2 relative"
    >
      <div className="w-20 h-16 aspect-video bg-muted rounded-md relative flex items-center justify-center overflow-hidden">
        {contentType ? (
          contentType.startsWith('image') ? (
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
          <>
            <div
              data-testid="input-attachment-loader"
              className="animate-spin absolute text-zinc-500"
            >
              <LoaderIcon />
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="absolute top-1 right-1 text-black text-xs font-bold leading-none hover:opacity-70"
                aria-label="Cancel upload"
              >
                ×
              </button>
            )}
          </>
        )}

        {!isUploading && onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-1 right-1 text-black text-xs font-bold leading-none hover:opacity-70"
            aria-label="Remove attachment"
          >
            ×
          </button>
        )}
      </div>
      <div className="text-xs text-zinc-500 max-w-16 truncate">{name}</div>
    </div>
  );
};
