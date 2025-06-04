"use client";

import type { Attachment } from "ai";

import { LoaderIcon } from "./icons";
import { useState } from "react";

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
  onRemove,
}: {
  attachment: Attachment;
  isUploading?: boolean;
  onRemove?: () => void;
}) => {
  const { name, url, contentType } = attachment;
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <div
        data-testid="input-attachment-preview"
        className="flex flex-col gap-2"
      >
        <div className="w-20 h-16 aspect-video bg-muted rounded-md relative flex flex-col items-center justify-center">
          {contentType ? (
            contentType.startsWith("image") ? (
              // NOTE: it is recommended to use next/image for images
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt={name ?? "An image attachment"}
                className="rounded-md size-full object-cover cursor-pointer"
                onClick={() => setShowPreview(true)}
              />
            ) : (
              <div className="" />
            )
          ) : (
            <div className="" />
          )}

          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-1 right-1 size-5 rounded-full bg-zinc-100 text-black hover:bg-zinc-700 hover:text-white flex items-center justify-center shadow text-xs transition border border-zinc-700"
              style={{ zIndex: 10 }}
            >
              ×
            </button>
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

      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowPreview(false)}
        >
          <div className="relative">
            <button
              type="button"
              className="absolute top-1 right-1 size-8 rounded-full bg-zinc-100 text-black hover:bg-zinc-700 hover:text-white flex items-center justify-center shadow text-xl transition border border-zinc-700"
              style={{ zIndex: 60 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowPreview(false);
              }}
            >
              ×
            </button>

            {/* NOTE: it is recommended to use next/image for images */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={name ?? "An image attachment"}
              className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};
