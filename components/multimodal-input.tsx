/**
 * @file components/multimodal-input.tsx
 * @description Компонент для ввода мультимодальных сообщений, включая текст и вложения.
 * @version 1.4.0
 * @date 2025-06-06
 * @updated Убрана рамка у Textarea при фокусе, кнопка отправки стала круглой.
 */

/** HISTORY:
 * v1.4.0 (2025-06-06): Убрана рамка у Textarea при фокусе. Кнопка отправки стала круглой и с рамкой.
 * v1.3.0 (2025-06-06): Исправлены стили Textarea и кнопки отправки.
 * v1.2.0 (2025-06-05): Полный редизайн. Textarea с autosize, панель управления, Cmd+Enter.
 * v1.1.0 (2025-06-05): Добавлен ModelSelector.
 * v1.0.0 (2025-05-25): Начальная версия компонента.
 */

'use client';

import type { Attachment, UIMessage } from 'ai';
import type React from 'react';
import {
  useRef,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
} from 'react';
import { toast } from 'sonner';
import Textarea from 'react-textarea-autosize';

import { ArrowUpIcon, PaperclipIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from './ui/button';
import { SuggestedActions } from './suggested-actions';
import type { UseChatHelpers } from '@ai-sdk/react';
import { ModelSelector } from './model-selector';
import type { Session } from 'next-auth';

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  attachments,
  setAttachments,
  messages,
  append,
  handleSubmit,
  session,
  initialChatModel,
}: {
  chatId: string;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  session: Session;
  initialChatModel: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    if (status !== 'ready') {
      toast.error('Please wait for the model to finish its response!');
      return;
    }

    window.history.replaceState({}, '', `/chat/${chatId}`);

    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    setInput('');
  }, [status, chatId, handleSubmit, attachments, setAttachments, setInput]);

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
        return { url, name: pathname, contentType: contentType };
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
        // @ts-ignore
        setAttachments((current) => [...current, ...successfullyUploadedAttachments]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  return (
    <div className="relative w-full flex flex-col gap-2">
      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions
            append={append}
            chatId={chatId}
            // @ts-ignore
            selectedVisibilityType={'private'}
          />
        )}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      <div className="flex flex-col w-full p-2 bg-muted dark:bg-zinc-800 rounded-2xl border dark:border-zinc-700">
         {(attachments.length > 0 || uploadQueue.length > 0) && (
            <div
              data-testid="attachments-preview"
              className="flex flex-row gap-2 overflow-x-scroll items-end p-2 border-b dark:border-zinc-700"
            >
              {attachments.map((attachment, idx) => (
                <PreviewAttachment
                  key={attachment.url}
                  attachment={attachment}
                  onRemove={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                />
              ))}
              {uploadQueue.map((filename) => (
                <PreviewAttachment
                  key={filename}
                  attachment={{ url: '', name: filename, contentType: '' }}
                  isUploading={true}
                />
              ))}
            </div>
          )}

        <Textarea
          data-testid="multimodal-input"
          placeholder="Send a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full resize-none bg-transparent !text-base border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none p-2"
          rows={2}
          maxRows={12}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !event.shiftKey) {
              event.preventDefault();
              submitForm();
            }
          }}
        />

        <div className="flex w-full items-center justify-between gap-2 pt-2">
          <div className="flex gap-1">
             <Button
                data-testid="attachments-button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={status !== 'ready'}
              >
                <PaperclipIcon size={18} />
              </Button>
            <ModelSelector
              session={session}
              selectedModelId={initialChatModel}
              className=''
            />
          </div>

          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">⌘+Enter to send</p>
            <Button
              data-testid="send-button"
              size="icon"
              variant="outline"
              className="rounded-full"
              onClick={(e) => {
                e.preventDefault();
                submitForm();
              }}
              disabled={input.length === 0 || uploadQueue.length > 0 || status !== 'ready'}
            >
              <ArrowUpIcon size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const MultimodalInput = PureMultimodalInput;
// END OF: components/multimodal-input.tsx