import type { Attachment } from 'ai';
import { LoaderIcon } from './icons';

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
}: {
  attachment: Attachment;
  isUploading?: boolean;
}) => {
  const { name, url, contentType } = attachment;

  // Helper function to get file type label and styles
  const getFileTypeRepresentation = (contentType: string | undefined) => {
    if (!contentType) return { label: 'Unknown', bgClass: 'bg-gray-300' };

    if (contentType.startsWith('image')) return null; // For images, show actual preview

    const typeMap: Record<string, { label: string; bgClass: string }> = {
      'application/pdf': { label: 'PDF', bgClass: 'bg-red-500' },
      'application/msword': { label: 'DOC', bgClass: 'bg-blue-500' },
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { label: 'DOCX', bgClass: 'bg-blue-500' },
      'application/vnd.ms-excel': { label: 'XLS', bgClass: 'bg-green-500' },
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { label: 'XLSX', bgClass: 'bg-green-500' },
      'application/vnd.ms-powerpoint': { label: 'PPT', bgClass: 'bg-orange-500' },
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': { label: 'PPTX', bgClass: 'bg-orange-500' },
      'application/zip': { label: 'ZIP', bgClass: 'bg-yellow-500' },
      'application/x-rar-compressed': { label: 'RAR', bgClass: 'bg-yellow-500' },
      'audio/mpeg': { label: 'MP3', bgClass: 'bg-purple-500' },
      'audio/wav': { label: 'WAV', bgClass: 'bg-purple-500' },
      'video/mp4': { label: 'MP4', bgClass: 'bg-pink-500' },
      'video/x-msvideo': { label: 'AVI', bgClass: 'bg-pink-500' },
      'text/plain': { label: 'TXT', bgClass: 'bg-gray-500' },
      'text/csv': { label: 'CSV', bgClass: 'bg-teal-500' },
    };

    return (
      typeMap[contentType] || {
        label: contentType.split('/')[1]?.toUpperCase() || 'File',
        bgClass: 'bg-gray-400',
      }
    );
  };

  const fileType = getFileTypeRepresentation(contentType);

  return (
    <div className="flex flex-col gap-2">
      <div className="w-20 aspect-video bg-muted rounded-md relative flex items-center justify-center">
        {contentType && contentType.startsWith('image') ? (
          // For images, show the actual preview
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt={name ?? 'An image attachment'}
            className="rounded-md size-full object-cover"
          />
        ) : (
          fileType && (
            <div
              className={`w-full h-full flex items-center justify-center rounded-md text-white text-sm font-medium ${fileType.bgClass}`}
            >
              {fileType.label}
            </div>
          )
        )}

        {isUploading && (
          <div className="animate-spin absolute text-zinc-500">
            <LoaderIcon />
          </div>
        )}
      </div>
      <div className="text-xs text-zinc-500 max-w-16 truncate">{name}</div>
    </div>
  );
};
