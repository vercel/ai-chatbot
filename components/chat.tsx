'use client';

import { ArrowLeft, ArrowRight, LogOut } from 'lucide-react';
import type { Attachment, ChatMessage } from '@/lib/types';
import { fetchWithErrorHandlers, fetcher, generateUUID } from '@/lib/utils';
import { useArtifact, useArtifactSelector } from '@/hooks/use-artifact';
import { useEffect, useRef, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import { Artifact } from './artifact';
import { BenefitApplicationsLanding } from './benefit-applications-landing';
import { BrowserPanel } from './browser-panel';
import { Button } from '@/components/ui/button';
import { ChatHeader } from '@/components/chat-header';
import { ChatSDKError } from '@/lib/errors';
import { DefaultChatTransport } from 'ai';
import { Input } from '@/components/ui/input';
import { Messages } from './messages';
import { MultimodalInput } from './multimodal-input';
import type { Session } from 'next-auth';
import { SideChatHeader } from '@/components/side-chat-header';
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
  const [benefitApplicationsChatMode, setBenefitApplicationsChatMode] = useState<boolean>(false);
  const [browserConnected, setBrowserConnected] = useState<boolean>(false);
  const [browserConnecting, setBrowserConnecting] = useState<boolean>(false);
  const [browserError, setBrowserError] = useState<string | null>(null);
  const [lastFrame, setLastFrame] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      } else if (initialChatModel === 'benefit-applications-agent') {
        // For benefit-applications-agent, use the split-screen layout (no artifact overlay)
        // The browser view is handled in the split-screen layout
        setBenefitApplicationsChatMode(true);
        setBrowserPanelVisible(true);
      } else {
        // For other models, use the old BrowserPanel
        if (!browserPanelVisible) {
          setBrowserPanelVisible(true);
        }
      }
    }
  }, [messages, browserPanelVisible, initialChatModel, isArtifactVisible, setArtifact, browserArtifactDismissed]);

  // Track when user manually closes the browser artifact (only for web-automation-model)
  useEffect(() => {
    // If artifact was visible and now it's not, and we have browser tool calls, user dismissed it
    if (!isArtifactVisible && !browserArtifactDismissed && initialChatModel === 'web-automation-model') {
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
      
      if (hasBrowserToolCall) {
        setBrowserArtifactDismissed(true);
      }
    }
  }, [isArtifactVisible, browserArtifactDismissed, messages, initialChatModel]);

  // Reset dismissed state when messages change significantly (new automation request)
  useEffect(() => {
    // If we have new messages and the last message is from user, reset dismissed state (only for web-automation-model)
    if (messages.length > 0 && initialChatModel === 'web-automation-model') {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user' && browserArtifactDismissed) {
        setBrowserArtifactDismissed(false);
      }
    }
  }, [messages.length, browserArtifactDismissed, initialChatModel]);

  // Handle benefit applications agent UI transitions
  useEffect(() => {
    if (initialChatModel === 'benefit-applications-agent' && messages.length > 0) {
      // Check if agent has found a website to navigate to (has browser tool calls)
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
      
      // Only switch to split-screen mode when browser tools are detected
      if (hasBrowserToolCall) {
        setBenefitApplicationsChatMode(true);
        setBrowserPanelVisible(true);
      }
    }
  }, [initialChatModel, messages]);

  // Reset benefitApplicationsChatMode when starting a new chat
  useEffect(() => {
    if (initialChatModel === 'benefit-applications-agent' && messages.length === 0) {
      setBenefitApplicationsChatMode(false);
    }
  }, [initialChatModel, messages.length]);

  // Browser WebSocket connection logic
  const connectToBrowserStream = async () => {
    try {
      setBrowserConnecting(true);
      setBrowserError(null);

      const response = await fetch(`/api/browser-stream?sessionId=${browserSessionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const connectionInfo = await response.json();

      if (connectionInfo.error) {
        throw new Error(connectionInfo.error);
      }

      const ws = new WebSocket(connectionInfo.url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to browser streaming service');
        setBrowserConnected(true);
        setBrowserConnecting(false);
        
        ws.send(JSON.stringify({
          type: 'start-streaming',
          sessionId: browserSessionId
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'frame' && data.data) {
            setLastFrame(data.data);
            
            // Update canvas with new frame
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                const img = new Image();
                img.onload = () => {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                };
                img.src = `data:image/jpeg;base64,${data.data}`;
              }
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('Browser streaming connection closed');
        setBrowserConnected(false);
        setBrowserConnecting(false);
      };

      ws.onerror = (error) => {
        console.error('Browser streaming WebSocket error:', error);
        setBrowserError('Connection failed');
        setBrowserConnecting(false);
      };

    } catch (error) {
      console.error('Failed to connect to browser stream:', error);
      setBrowserError(error instanceof Error ? error.message : 'Connection failed');
      setBrowserConnecting(false);
    }
  };

  const disconnectFromBrowserStream = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setBrowserConnected(false);
    setLastFrame(null);
    setBrowserError(null);
  };

  // Auto-connect when in benefit applications chat mode
  useEffect(() => {
    if (benefitApplicationsChatMode && !browserConnected && !browserConnecting) {
      connectToBrowserStream();
    }
  }, [benefitApplicationsChatMode, browserConnected, browserConnecting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromBrowserStream();
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  // Handler for benefit applications landing page
  const handleBenefitApplicationsMessage = (messageText: string) => {
    sendMessage({
      role: 'user' as const,
      parts: [{ type: 'text', text: messageText }],
    });
  };

  // Special UI for benefit applications agent - show landing page initially
  if (initialChatModel === 'benefit-applications-agent' && messages.length === 0) {
    // Show landing page with header
    return (
      <>
        <div className="flex h-dvh bg-background flex-col">
          <ChatHeader
            chatId={id}
            selectedModelId={initialChatModel}
            selectedVisibilityType={initialVisibilityType}
            isReadonly={isReadonly}
            session={session}
          />
          <BenefitApplicationsLanding
            onSendMessage={handleBenefitApplicationsMessage}
            isReadonly={isReadonly}
            chatId={id}
            sendMessage={sendMessage}
            selectedVisibilityType={visibilityType}
          />
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

  // Special UI for benefit applications agent - full page chat (before website detection)
  if (initialChatModel === 'benefit-applications-agent' && messages.length > 0 && !benefitApplicationsChatMode) {
    return (
      <>
        <div className="flex h-dvh flex-col" style={{ backgroundColor: '#F4E4F0' }}>
          <ChatHeader
            chatId={id}
            selectedModelId={initialChatModel}
            selectedVisibilityType={initialVisibilityType}
            isReadonly={isReadonly}
            session={session}
          />

          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="max-w-4xl w-full text-left">
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

              <div className="mt-8">
                {!isReadonly && (
                  <form className="flex gap-3 max-w-2xl mx-auto">
                    <div className="relative flex-1">
                      <textarea
                        placeholder="Write something"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="w-full h-24 resize-none text-lg border-2 border-purple-300 rounded-lg pr-14 pl-3 py-3 focus:outline-none"
                        style={{
                          borderColor: '#D1D5DB',
                          '--tw-ring-color': '#814092',
                          width: '100%',
                          minWidth: '600px', // Make textarea bigger
                          maxWidth: '100%',
                        } as React.CSSProperties}
                        onFocus={e => (e.target.style.borderColor = '#814092')}
                        onBlur={e => (e.target.style.borderColor = '#D1D5DB')}
                        disabled={isReadonly}
                      />
                      <Button
                        type="submit"
                        disabled={!input.trim() || isReadonly}
                        className="absolute bottom-3 right-3 h-10 w-10 rounded-full text-white p-0 flex items-center justify-center"
                        style={{ backgroundColor: '#814092' }}
                        onClick={e => {
                          e.preventDefault();
                          if (input.trim()) {
                            sendMessage({
                              role: 'user' as const,
                              parts: [{ type: 'text', text: input.trim() }],
                            });
                            setInput('');
                          }
                        }}
                        tabIndex={-1}
                      >
                        <ArrowRight className="w-6 h-6" />
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
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

  // Special UI for benefit applications agent - compact chat with browser artifact
  if (initialChatModel === 'benefit-applications-agent' && benefitApplicationsChatMode) {
    return (
      <>
        <div className="flex h-dvh" style={{ backgroundColor: '#F4E4F0' }}>
          {/* Left Panel - Chat (responsive width based on browser panel visibility) */}
          <div className={`${browserPanelVisible ? 'w-[30%] border-r border-gray-200' : 'w-full'} flex flex-col bg-white`}>
            <SideChatHeader
              title="Benefit Applications Assistant"
              description="Get help with benefit applications and eligibility"
              status="online"
            />
            
            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={messagesEndRef}>
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
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200" style={{ backgroundColor: '#EFD9E9', padding: '18px' }}>
              {!isReadonly && (
                <div className="relative">
                  <textarea
                    placeholder="Send a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full h-20 resize-none text-sm border border-gray-300 rounded-lg pr-12 pl-3 py-3 focus:outline-none"
                    style={{ 
                      borderColor: '#D1D5DB',
                      '--tw-ring-color': '#814092'
                    } as React.CSSProperties}
                    onFocus={(e) => e.target.style.borderColor = '#814092'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    disabled={isReadonly}
                  />
                  <Button
                    onClick={() => {
                      if (input.trim()) {
                        sendMessage({
                          role: 'user' as const,
                          parts: [{ type: 'text', text: input.trim() }],
                        });
                        setInput('');
                      }
                    }}
                    disabled={!input.trim() || isReadonly}
                    className="absolute bottom-2 right-2 h-8 w-8 rounded-full text-white p-0 flex items-center justify-center"
                    style={{ backgroundColor: '#814092' }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Browser View (only show when browserPanelVisible is true) */}
          {browserPanelVisible && (
            <div className="w-[70%] flex flex-col">
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

  // Default layout for other models (not benefit applications agent)
  if (initialChatModel === 'benefit-applications-agent') {
    // This should never be reached due to the conditions above
    return null;
  }

  // Default layout for other models (not benefit applications agent)
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
