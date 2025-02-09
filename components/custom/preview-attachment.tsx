import { Attachment } from 'ai';
import { FileIcon } from 'lucide-react';
import { useState } from 'react';

import { LoaderIcon } from './icons';

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
}: {
  attachment: Attachment;
  isUploading?: boolean;
}) => {
  const { name, url, contentType } = attachment;
  const isPDF = contentType === 'application/pdf';
  const [showPDF, setShowPDF] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="w-full bg-muted rounded-md relative">
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
          ) : isPDF ? (
            <>
              <div 
                className="cursor-pointer p-4 flex items-center gap-2"
                onClick={() => setShowPDF(!showPDF)}
              >
                <FileIcon className="h-4 w-4" />
                <span className="text-sm">
                  {showPDF ? 'Hide PDF' : 'View PDF'}
                </span>
              </div>
              {showPDF && (
                <iframe
                  src={url}
                  className="w-full h-[600px] rounded-md mt-2"
                  title={name ?? 'PDF Document'}
                />
              )}
            </>
          ) : (
            <div className="p-4 flex items-center gap-2">
              <FileIcon className="h-4 w-4" />
              <span className="text-sm">Unsupported file type</span>
            </div>
          )
        ) : null}

        {isUploading && (
          <div className="animate-spin absolute text-zinc-500">
            <LoaderIcon />
          </div>
        )}
      </div>
      {name && (
        <div className="text-xs text-zinc-500 truncate">{name}</div>
      )}
    </div>
  );
};
