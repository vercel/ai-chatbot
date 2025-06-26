'use client';

import type { UIMessage } from 'ai';
import { PreviewAttachment } from '../preview-attachment';

interface MessageAttachmentsProps {
  message: UIMessage;
}

export function MessageAttachments({ message }: MessageAttachmentsProps) {
  if (
    !message.experimental_attachments ||
    message.experimental_attachments.length === 0
  ) {
    return null;
  }

  return (
    <div
      data-testid="message-attachments"
      className="flex flex-row justify-end gap-2"
    >
      {message.experimental_attachments.map((attachment) => (
        <PreviewAttachment key={attachment.url} attachment={attachment} />
      ))}
    </div>
  );
}
