'use client';

import type { Attachment, ChatMessage } from '@/lib/types';
import { fetchWithErrorHandlers, fetcher, generateUUID } from '@/lib/utils';
import { useArtifact, useArtifactSelector } from '@/hooks/use-artifact';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import { Artifact } from './artifact';
import { BrowserPanel } from './browser-panel';
import { ChatHeader } from '@/components/chat-header';
import { ChatSDKError } from '@/lib/errors';
import { DefaultChatTransport } from 'ai';
import { Messages } from './messages';
import { MultimodalInput } from './multimodal-input';
import type { Session } from 'next-auth';
import type { VisibilityType } from './visibility-selector';
import type { Vote } from '@/lib/db/schema';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
import { unstable_serialize } from 'swr/infinite';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { useChat } from '@ai-sdk/react';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useDataStream } from './data-stream-provider';
import { useSearchParams } from 'next/navigation';

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>('');
  const [browserPanelVisible, setBrowserPanelVisible] = useState<boolean>(false);
  const [browserSessionId, setBrowserSessionId] = useState<string>(id);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          body: {
            id,
            message: messages.at(-1),
            selectedChatModel: initialChatModel,
            selectedVisibilityType: visibilityType,
            ...body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast({
          type: 'error',
          description: error.message,
        });
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        role: 'user' as const,
        parts: [{ type: 'text', text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const { setArtifact } = useArtifact();
  const [browserArtifactDismissed, setBrowserArtifactDismissed] = useState(false);

  // Monitor messages for browser tool usage
  useEffect(() => {
    const hasBrowserToolCall = messages.some(message => 
      message.parts?.some(part => {
        const partType = (part as any).type;
        const toolName = (part as any).toolName;
        
        // Check for tool-call type with playwright toolName
        if (partType === 'tool-call' && 
            (toolName?.startsWith('playwright_browser') || 
             toolName?.startsWith('mcp_playwright_browser'))) {
          return true;
        }
        
        // Check for tool- prefixed types (how tools appear in message parts)
        if (partType?.startsWith('tool-playwright_browser') ||
            partType?.startsWith('tool-mcp_playwright_browser')) {
          return true;
        }
        
        return false;
      })
    );
    
    if (hasBrowserToolCall) {
      if (initialChatModel === 'web-automation-model') {
        // For web-automation-model, create browser artifact (only if not manually dismissed)
        if (!isArtifactVisible && !browserArtifactDismissed) {
          const userMessage = messages.find(msg => msg.role === 'user');
          const messageText = userMessage?.parts.find(part => part.type === 'text')?.text || 'Web Automation';
          const title = `Browser: ${messageText.slice(0, 40)}${messageText.length > 40 ? '...' : ''}`;
          
          setArtifact({
            documentId: generateUUID(),
            content: `# ${title}\n\nBrowser automation session starting...`,
            kind: 'browser',
            title,
            status: 'idle',
            isVisible: true,
            boundingBox: {
              top: 0,
              left: 0,
              width: 0,
              height: 0,
            },
          });
        }
      } else {
        // For other models, use the old BrowserPanel
        if (!browserPanelVisible) {
          setBrowserPanelVisible(true);
        }
      }
    }
  }, [messages, browserPanelVisible, initialChatModel, isArtifactVisible, setArtifact, browserArtifactDismissed]);

  // Track when user manually closes the browser artifact
  useEffect(() => {
    // If artifact was visible and now it's not, and we have browser tool calls, user dismissed it
    if (!isArtifactVisible && !browserArtifactDismissed) {
      const hasBrowserToolCall = messages.some(message => 
        message.parts?.some(part => {
          const partType = (part as any).type;
          const toolName = (part as any).toolName;
          
          return (partType === 'tool-call' && 
                  (toolName?.startsWith('playwright_browser') || 
                   toolName?.startsWith('mcp_playwright_browser'))) ||
                 (partType?.startsWith('tool-playwright_browser') ||
                  partType?.startsWith('tool-mcp_playwright_browser'));
        })
      );
      
      if (hasBrowserToolCall && initialChatModel === 'web-automation-model') {
        setBrowserArtifactDismissed(true);
      }
    }
  }, [isArtifactVisible, browserArtifactDismissed, messages, initialChatModel]);

  // Reset dismissed state when messages change significantly (new automation request)
  useEffect(() => {
    // If we have new messages and the last message is from user, reset dismissed state
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user' && browserArtifactDismissed) {
        setBrowserArtifactDismissed(false);
      }
    }
  }, [messages.length, browserArtifactDismissed]);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <>
      <div className={`flex h-dvh bg-background ${browserPanelVisible ? 'flex-row' : 'flex-col'}`}>
        {/* Chat Panel */}
        <div className={`flex flex-col min-w-0 h-full ${browserPanelVisible ? 'w-1/2 border-r' : 'w-full'}`}>
          <ChatHeader
            chatId={id}
            selectedModelId={initialChatModel}
            selectedVisibilityType={initialVisibilityType}
            isReadonly={isReadonly}
            session={session}
          />

          <Messages
            chatId={id}
            status={status}
            votes={votes}
            messages={messages}
            setMessages={setMessages}
            regenerate={regenerate}
            isReadonly={isReadonly}
            isArtifactVisible={isArtifactVisible}
          />

          <div className="shrink-0 mx-auto px-4 bg-background pb-4 md:pb-6 w-full">
            {!isReadonly && (
              <form className="flex gap-2 w-full md:max-w-3xl mx-auto">
                <MultimodalInput
                  chatId={id}
                  input={input}
                  setInput={setInput}
                  status={status}
                  stop={stop}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  messages={messages}
                  setMessages={setMessages}
                  sendMessage={sendMessage}
                  selectedVisibilityType={visibilityType}
                />
              </form>
            )}
          </div>
        </div>

        {/* Browser Panel */}
        {browserPanelVisible && (
          <div className="w-1/2 flex flex-col">
            <BrowserPanel
              sessionId={browserSessionId}
              isVisible={browserPanelVisible}
              onToggle={setBrowserPanelVisible}
            />
          </div>
        )}
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        sendMessage={sendMessage}
        messages={messages}
        setMessages={setMessages}
        regenerate={regenerate}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
      />
    </>
  );
}
