'use client';

import type { LanguageModelUsage, UIMessage } from 'ai';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
  useMemo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import {
  ArrowUpIcon,
  CpuIcon,
  ChevronDownIcon,
} from './icons';
import { Button } from './ui/button';
import { SuggestedActions } from './suggested-actions';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputMessage,
  PromptInputAttachment,
  PromptInputBody,
  PromptInputAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
} from './elements/prompt-input';
import { SelectItem } from '@/components/ui/select';
import * as SelectPrimitive from '@radix-ui/react-select';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ChevronUpIcon, ImageIcon, Loader2Icon, SquareIcon, TriangleAlertIcon, XIcon } from 'lucide-react';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import type { VisibilityType } from './visibility-selector';
import type { Attachment, ChatMessage } from '@/lib/types';
import { chatModels } from '@/lib/ai/models';
import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { startTransition } from 'react';
import { getContextWindow, type ModelId, normalizeUsage } from 'tokenlens';
import { Context } from './elements/context';
import { myProvider } from '@/lib/ai/providers';
import { PreviewAttachment } from './preview-attachment';
import { DropdownMenuItem } from './ui/dropdown-menu';

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
  sendMessage,
  className,
  selectedVisibilityType,
  selectedModelId,
  usage,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  className?: string;
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
  usage?: LanguageModelUsage;
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
      textareaRef.current.style.height = '44px';
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(
    (message: PromptInputMessage) => {
      window.history.replaceState({}, '', `/chat/${chatId}`);

      sendMessage({
        role: 'user',
        parts: [
          ...attachments.map((attachment) => ({
            type: 'file' as const,
            url: attachment.url,
            name: attachment.name,
            mediaType: attachment.contentType,
          })),
          {
            type: 'text',
            text: message.text ?? 'Files were attached',
          },
        ],
      });

      setAttachments([]);
      setLocalStorageInput('');
      resetHeight();
      setInput('');

      if (width && width > 768) {
        textareaRef.current?.focus();
      }
    },
    [
      input,
      setInput,
      attachments,
      sendMessage,
      setAttachments,
      setLocalStorageInput,
      width,
      chatId,
    ],
  );

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

  const modelResolver = useMemo(() => {
    return myProvider.languageModel(selectedModelId);
  }, [selectedModelId]);

  const contextMax = useMemo(() => {
    // Resolve from selected model; stable across chunks.
    const cw = getContextWindow(modelResolver.modelId);
    return cw.combinedMax ?? cw.inputMax ?? 0;
  }, [modelResolver]);

  const usedTokens = useMemo(() => {
    // Prefer explicit usage data part captured via onData
    if (!usage) return 0; // update only when final usage arrives
    const n = normalizeUsage(usage);
    return typeof n.total === 'number'
      ? n.total
      : (n.input ?? 0) + (n.output ?? 0);
  }, [usage]);

  const contextProps = useMemo(
    () => ({
      maxTokens: contextMax,
      usedTokens,
      usage,
      modelId: modelResolver.modelId as ModelId,
    }),
    [contextMax, usedTokens, usage, modelResolver],
  );

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

  const { isAtBottom, scrollToBottom } = useScrollToBottom();

  useEffect(() => {
    if (status === 'submitted') {
      scrollToBottom();
    }
  }, [status, scrollToBottom]);

  return (
    <div className="relative flex w-full flex-col gap-4">
      <AnimatePresence>
        {!isAtBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="-top-12 -translate-x-1/2 absolute left-1/2 z-50"
          >
            <Button
              data-testid="scroll-to-bottom-button"
              className="rounded-full"
              size="icon"
              variant="outline"
              onClick={(event) => {
                event.preventDefault();
                scrollToBottom();
              }}
            >
              <ArrowDown />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions
            sendMessage={sendMessage}
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
          />
        )}

      <input
        type="file"
        className="-top-4 -left-4 pointer-events-none fixed size-0.5 opacity-0"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      <PromptInput
        className="rounded-xl border border-border bg-background shadow-xs transition-all duration-200 focus-within:border-border hover:border-muted-foreground/50"
        onSubmit={(message: PromptInputMessage) => {
          const hasText = Boolean(message.text);
          const hasAttachments = Boolean(attachments.length);

          if (!(hasText || hasAttachments)) {
            return;
          }

          if (status !== 'ready') {
            toast.error('Please wait for the model to finish its response!');
          } else {
            submitForm(message);
          }
        }}
        globalDrop
      >
        <PromptInputBody>
          <AnimatePresence initial={false}>
            {(attachments.length > 0 || uploadQueue.length > 0) && (
              <motion.div
                data-testid="attachments-preview"
                aria-live="polite"
                className="overflow-hidden flex flex-wrap gap-2 p-3 pt-3"
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {attachments.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={attachment}
                    onRemove={() => {
                      setAttachments((currentAttachments) =>
                        currentAttachments.filter(
                          (a) => a.url !== attachment.url,
                        ),
                      );
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  />
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
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex flex-row items-start gap-1 sm:gap-2 pt-2">
            <PromptInputTextarea
              data-testid="multimodal-input"
              ref={textareaRef}
              placeholder="Send a message..."
              value={input}
              onChange={handleInput}
              className="grow resize-none border-0! border-none! bg-transparent px-2 pt-1 pb-3 ml-1 text-sm outline-none ring-0 [-ms-overflow-style:none] [scrollbar-width:none] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-scrollbar]:hidden"
              rows={1}
              autoFocus
            />{' '}
            <div className="mr-0.5 mt-1">
              <Context {...contextProps} />
            </div>
          </div>
        </PromptInputBody>
        <PromptInputToolbar className="!border-top-0 border-t-0! px-2 py-2 shadow-none dark:border-0 dark:border-transparent!">
          <PromptInputTools className="gap-0 sm:gap-0.5">
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <ActionAddAttachments
                  fileInputRef={fileInputRef}
                  status={status}
                  selectedModelId={selectedModelId}
                />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <ModelSelectorCompact selectedModelId={selectedModelId} />
          </PromptInputTools>

          <PromptInputSubmit
            status={status}
            disabled={!input.trim() || !status || uploadQueue.length > 0}
            className="size-7 rounded-full bg-primary p-1 text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
          >
            {status === 'submitted' ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : status === 'streaming' ? (
              <SquareIcon className="size-4 p-0.5 fill-primary-foreground" />
            ) : status === 'error' ? (
              <TriangleAlertIcon className="size-4" />
            ) : (
              <ArrowUpIcon className="size-4" />
            )}
          </PromptInputSubmit>
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;
    if (prevProps.selectedModelId !== nextProps.selectedModelId) return false;

    return true;
  },
);

function PureActionAddAttachments({
  fileInputRef,
  status,
  selectedModelId,
  ...props
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>['status'];
  selectedModelId: string;
}) {
  const isReasoningModel = selectedModelId === 'chat-model-reasoning';

  return (
    <DropdownMenuItem
      {...props}
      onSelect={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== 'ready' || isReasoningModel}
    >
      <ImageIcon className="mr-2 size-4" /> Add photos or files
    </DropdownMenuItem>
  );
}

const ActionAddAttachments = memo(PureActionAddAttachments);

function PureModelSelectorCompact({
  selectedModelId,
}: {
  selectedModelId: string;
}) {
  const [optimisticModelId, setOptimisticModelId] = useState(selectedModelId);

  const selectedModel = chatModels.find(
    (model) => model.id === optimisticModelId,
  );

  return (
    <PromptInputModelSelect
      value={selectedModel?.name}
      onValueChange={(modelName) => {
        const model = chatModels.find((m) => m.name === modelName);
        if (model) {
          setOptimisticModelId(model.id);
          startTransition(() => {
            saveChatModelAsCookie(model.id);
          });
        }
      }}
    >
      <SelectPrimitive.Trigger
        type="button"
        className="flex items-center gap-2 px-2 h-8 rounded-lg border-0 bg-background text-foreground hover:bg-accent transition-colors focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
      >
        <CpuIcon size={16} />
        <span className="text-xs font-medium sm:block hidden">
          {selectedModel?.name}
        </span>
        <ChevronUpIcon size={16} />
      </SelectPrimitive.Trigger>
      <PromptInputModelSelectContent className="min-w-[260px] p-0">
        {chatModels.map((model) => (
          <SelectItem
            key={model.id}
            value={model.name}
            className="pl-3 pr-8 py-2 text-xs"
          >
            <div className="flex flex-col min-w-0 flex-1">
              <div className="font-medium truncate text-xs">{model.name}</div>
              <div className="text-[10px] text-muted-foreground truncate leading-tight">
                {model.description}
              </div>
            </div>
          </SelectItem>
        ))}
      </PromptInputModelSelectContent>
    </PromptInputModelSelect>
  );
}

const ModelSelectorCompact = memo(PureModelSelectorCompact);
