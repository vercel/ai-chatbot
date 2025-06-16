import type { Attachment } from 'ai';
import { LoaderIcon } from './icons';
import { AudioAttachments } from './audioAttachment';
import { useEffect, useState } from 'react';

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
  const isImage = contentType?.startsWith('image');
  const isAudio = contentType?.startsWith('audio/');

  return (
    <div
      data-testid="input-attachment-preview"
      className="flex flex-col gap-2 relative"
    >
      <div
        className={`relative rounded-md overflow-hidden ${
          isImage
            ? 'w-20 h-16 aspect-video'
            : isAudio
              ? 'w-[300px] h-auto'
              : 'w-20 h-16'
        } bg-muted flex items-center justify-center`}
      >
        {contentType ? (
          contentType.startsWith('image') ? (
            <img
              key={url}
              src={url}
              alt={name ?? 'An image attachment'}
              className="rounded-md size-full object-cover"
            />
          ) : contentType.startsWith('audio/') ? (
            <AudioAttachments
              url={url}
              isUploading={isUploading}
              onCancel={onCancel}
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
                type="button"
                onClick={onCancel}
                className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-white text-black text-lg text-[10px] leading-none hover:opacity-80 shadow"
                aria-label="Remove attachment"
              >
                ×
              </button>
            )}
          </>
        )}

        {!isUploading && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-white text-black text-lg text-[10px] leading-none hover:opacity-80 shadow"
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
