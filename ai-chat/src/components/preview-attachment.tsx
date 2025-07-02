import { SourceFileTypes, type Source } from '@ai-chat/app/api/models';
import { LoaderIcon } from './icons';

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
}: {
  attachment: Source;
  isUploading?: boolean;
}) => {
  const { file_name, file_type, file_uri } = attachment;

  const mapFileTypes = () => {
    switch (file_type) {
      case SourceFileTypes.Docx:
        return (
          <img
            key={file_uri}
            src={'../../docx-file-logo.svg'}
            alt={file_name ?? 'An image attachment'}
            className="rounded-md size-full object-cover"
          />
        );
      case SourceFileTypes.Pdf:
        return (
          <img
            key={file_uri}
            src={'../../pdf-file-logo.svg'}
            alt={file_name ?? 'An image attachment'}
            className="rounded-md size-full object-cover"
          />
        );
      case SourceFileTypes.Txt:
        return (
          <img
            key={file_uri}
            src={'../../txt-file-logo.svg'}
            alt={file_name ?? 'An image attachment'}
            className="rounded-md size-full object-cover"
          />
        );

      default:
        return file_type.startsWith('image') ? (
          // NOTE: it is recommended to use next/image for images
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={file_uri}
            src={file_uri}
            alt={file_name ?? 'An image attachment'}
            className="rounded-md size-full object-cover"
          />
        ) : (
          <img
            key={file_uri}
            src={'../../file.svg'}
            alt={file_name ?? 'An image attachment'}
            className="rounded-md size-full object-cover"
          />
        );
    }
  };

  return (
    <div data-testid="input-attachment-preview" className="flex flex-col gap-2">
      <div className="w-20 h-16 aspect-video bg-muted rounded-md relative flex flex-col items-center justify-center">
        {mapFileTypes()}

        {isUploading && (
          <div
            data-testid="input-attachment-loader"
            className="animate-spin absolute text-zinc-500"
          >
            <LoaderIcon />
          </div>
        )}
      </div>
      <div className="text-xs text-zinc-500 max-w-16 truncate">{file_name}</div>
    </div>
  );
};
