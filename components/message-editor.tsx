'use client';

import { Button } from './ui/button';
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Textarea } from './ui/textarea';
import { deleteTrailingMessages } from '@/app/(chat)/actions';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useChatStore } from './chat-store';
import { toast } from './toast';

export type MessageEditorProps = {
  chatId: string;
  messageId: string;
  setMode: Dispatch<SetStateAction<'view' | 'edit'>>;
  reload: UseChatHelpers['reload'];
};

export function MessageEditor({
  chatId,
  messageId,
  setMode,
  reload,
}: MessageEditorProps) {
  const chatStore = useChatStore();
  const messages = chatStore.getMessages(chatId);
  const draftMessage = messages.find((message) => message.id === messageId);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [draftContent, setDraftContent] = useState<string>(
    draftMessage?.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('') ?? '',
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftContent(event.target.value);
    adjustHeight();
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <Textarea
        data-testid="message-editor"
        ref={textareaRef}
        className="bg-transparent outline-none overflow-hidden resize-none !text-base rounded-xl w-full"
        value={draftContent}
        onChange={handleInput}
      />

      <div className="flex flex-row gap-2 justify-end">
        <Button
          variant="outline"
          className="h-fit py-2 px-3"
          onClick={() => {
            setMode('view');
          }}
        >
          Cancel
        </Button>
        <Button
          data-testid="message-editor-send-button"
          variant="default"
          className="h-fit py-2 px-3"
          disabled={isSubmitting}
          onClick={async () => {
            if (!draftMessage) {
              return;
            }

            setIsSubmitting(true);

            await deleteTrailingMessages({
              id: draftMessage.id,
            });

            const index = messages.findIndex(
              (message) => message.id === draftMessage.id,
            );

            if (index === -1) {
              setIsSubmitting(false);
              toast({
                type: 'error',
                description: 'Something went wrong, please try again!',
              });

              return;
            }

            const updatedMessage = {
              ...draftMessage,
              parts: [{ type: 'text' as const, text: draftContent }],
            };

            chatStore.setMessages({
              id: chatId,
              messages: [...messages.slice(0, index), updatedMessage],
            });

            setMode('view');
            reload();
          }}
        >
          {isSubmitting ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
