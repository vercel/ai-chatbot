'use client';

import type { Attachment, UIMessage } from 'ai';
import cx from 'classnames';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useWindowSize } from 'usehooks-ts';

import { ArrowUpIcon, StopIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { SuggestedActions } from './suggested-actions';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { Plus, Globe, Lightbulb } from 'lucide-react';

// Custom hook to replace useLocalStorage and ensure no hydration mismatch
function useClientOnlyLocalStorage(key: string, initialValue: string) {
  // Initialize with empty string to avoid hydration mismatch
  const [value, setValue] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark that we're on the client side
    setIsClient(true);

    // Now safely access localStorage
    const storedValue = localStorage.getItem(key);
    setValue(storedValue || initialValue || '');
  }, [key, initialValue]);

  const setStoredValue = useCallback(
    (newValue: string) => {
      setValue(newValue);
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, newValue);
      }
    },
    [key],
  );

  return [value, setStoredValue] as const;
}

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
}: {
  chatId: string;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // Increase the reset height slightly
      textareaRef.current.style.height = '104px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useClientOnlyLocalStorage(
    'input',
    '',
  );
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (textareaRef.current && isClient) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration and when isClient is true
  }, [isClient, localStorageInput, setInput]);

  useEffect(() => {
    if (isClient) {
      setLocalStorageInput(input);
    }
  }, [input, setLocalStorageInput, isClient]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    setLocalStorageInput('');
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  return (
    <div
      className={cx(
        'relative w-full flex flex-col gap-4',
        messages.length === 0
          ? 'md:fixed md:left-1/2 md:top-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-3xl'
          : 'md:mx-auto md:max-w-3xl md:mb-6',
      )}
    >
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div
          data-testid="attachments-preview"
          className="flex flex-row gap-2 overflow-x-scroll items-end"
        >
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      {/* Input area with buttons - restructured for better flow */}
      <div className="relative">
        <Textarea
          data-testid="multimodal-input"
          ref={textareaRef}
          placeholder="What would you like to ask?"
          value={input}
          onChange={handleInput}
          className={cx(
            'min-h-[48px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-3xl !text-base bg-muted pt-5 pl-5 dark:bg-[#303030] pb-10 dark:border-zinc-700',
            className,
          )}
          rows={3}
          autoFocus
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();

              if (status !== 'ready') {
                toast.error(
                  'Please wait for the model to finish its response!',
                );
              } else {
                submitForm();
              }
            }
          }}
        />

        <div className="absolute bottom-0 p-2 w-fit flex flex-row justify-start items-center gap-2">
          <AttachmentsButton fileInputRef={fileInputRef} status={status} />
          <SearchButton status={status} />
          <DeepThinkButton status={status} />
        </div>

        <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
          {status === 'submitted' ? (
            <StopButton stop={stop} setMessages={setMessages} />
          ) : (
            <SendButton
              input={input}
              submitForm={submitForm}
              uploadQueue={uploadQueue}
            />
          )}
        </div>
      </div>

      {/* For mobile: Show below input */}
      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <div className="mt-4 mb-2 hidden">
            <SuggestedActions append={append} chatId={chatId} />
          </div>
        )}
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;

    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers['status'];
}) {
  return (
    <Button
      data-testid="attachments-button"
      className="rounded-full border  p-[9px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== 'ready'}
      variant="ghost"
    >
      <Plus size={14} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

// --- Add SearchButton ---
function PureSearchButton({ status }: { status: UseChatHelpers['status'] }) {
  return (
    <Button
      data-testid="search-button"
      className="rounded-full border p-[9px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200 flex items-center gap-1.5 md:min-w-[97px] md:justify-center" // Added min-width and justify-center for desktop
      onClick={(event) => {
        event.preventDefault();
        // TODO: Implement Search functionality
        toast.info('Search button clicked (not implemented)');
      }}
      disabled={status !== 'ready'}
      variant="ghost"
    >
      <Globe size={14} />
      <span className="hidden md:inline text-sm">Search</span>{' '}
      {/* Hide text on mobile */}
    </Button>
  );
}
const SearchButton = memo(PureSearchButton);

// --- Add DeepThinkButton ---
function PureDeepThinkButton({ status }: { status: UseChatHelpers['status'] }) {
  return (
    <Button
      data-testid="deepthink-button"
      className="rounded-full border p-[9px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200 flex items-center gap-1.5 md:min-w-[120px] md:justify-center" // Added min-width and justify-center for desktop
      onClick={(event) => {
        event.preventDefault();
        // TODO: Implement DeepThink functionality
        toast.info('DeepThink button clicked (not implemented)');
      }}
      disabled={status !== 'ready'}
      variant="ghost"
    >
      <Lightbulb size={14} /> {/* Using Brain icon */}
      <span className="hidden md:inline text-sm">DeepThink</span>{' '}
      {/* Hide text on mobile */}
    </Button>
  );
}
const DeepThinkButton = memo(PureDeepThinkButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers['setMessages'];
}) {
  return (
    <Button
      data-testid="stop-button"
      className="rounded-full  p-[9px] h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      data-testid="send-button"
      className="rounded-full p-[10px] h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <ArrowUpIcon size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
