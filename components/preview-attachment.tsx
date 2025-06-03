import type { Attachment } from 'ai';

import { LoaderIcon } from './icons';

const getFileIcon = (fileName: string, contentType?: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (contentType?.startsWith('image/')) {
    return '🖼️';
  }

  switch (extension) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'txt':
    case 'md':
    case 'markdown':
      return '📄';
    case 'json':
      return '📋';
    case 'csv':
      return '📊';
    default:
      return '📎';
  }
};

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
}: {
  attachment: Attachment;
  isUploading?: boolean;
}) => {
  const { name, url, contentType } = attachment;

  return (
    <div data-testid="input-attachment-preview" className="flex flex-col gap-2">
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
            <div className="text-2xl">
              {getFileIcon(name ?? '', contentType)}
            </div>
          )
        ) : (
          <div className="text-2xl">{getFileIcon(name ?? '')}</div>
        )}

        {isUploading && (
          <div
            data-testid="input-attachment-loader"
            className="animate-spin absolute text-zinc-500"
          >
            <LoaderIcon />
          </div>
        )}
      </div>
      <div className="text-xs text-zinc-500 max-w-16 truncate">{name}</div>
    </div>
  );
};
