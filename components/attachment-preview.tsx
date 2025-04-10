import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Attachment } from 'ai';

interface AttachmentPreviewProps {
  attachment: Attachment;
  onRemove: () => void;
}

export function AttachmentPreview({
  attachment,
  onRemove,
}: AttachmentPreviewProps) {
  return (
    <div className="relative inline-block group">
      <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
        <span className="text-sm text-muted-foreground">{attachment.name}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
