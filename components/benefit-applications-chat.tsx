'use client';

import { AlertCircle, ArrowLeft, Globe, Loader2, LogOut } from 'lucide-react';
import { useArtifact, useArtifactSelector } from '@/hooks/use-artifact';
import { useEffect, useRef, useState } from 'react';

import { BrowserPanel } from './browser-panel';
import { Button } from '@/components/ui/button';
import type { ChatMessage } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { generateUUID } from '@/lib/utils';

interface BenefitApplicationsChatProps {
  onSendMessage: (message: string) => void;
  messages: ChatMessage[];
  isReadonly?: boolean;
  browserSessionId?: string;
  browserPanelVisible?: boolean;
  onToggleBrowserPanel?: (visible: boolean) => void;
  status?: 'in_progress' | 'awaiting_message' | 'error';
}

export function BenefitApplicationsChat({ 
  onSendMessage, 
  messages, 
  isReadonly = false,
  browserSessionId = 'default',
  browserPanelVisible = false,
  onToggleBrowserPanel,
  status = 'awaiting_message'
}: BenefitApplicationsChatProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const { setArtifact } = useArtifact();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isReadonly && !isProcessing) {
      setIsProcessing(true);
      setError(null);
      onSendMessage(input.trim());
      setInput('');
    }
  };

  // Get participant name from latest user message or use fallback
  const latestUserMessage = messages.find(msg => msg.role === 'user');
  const participantName = latestUserMessage?.parts.find(part => part.type === 'text')?.text?.includes('Sarah') 
    ? 'Sarah Johnson' 
    : latestUserMessage?.parts.find(part => part.type === 'text')?.text?.includes('Maria')
    ? 'Maria Rodriguez'
    : 'Participant';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Monitor for web automation tool calls and create browser artifact
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
    
    if (hasBrowserToolCall && !isArtifactVisible) {
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
  }, [messages, isArtifactVisible, setArtifact]);

  // Update processing state based on status
  useEffect(() => {
    if (status === 'in_progress') {
      setIsProcessing(true);
    } else if (status === 'error') {
      setIsProcessing(false);
      setError('An error occurred during processing. Please try again.');
    } else {
      setIsProcessing(false);
      setError(null);
    }
  }, [status]);

  return (
    <div className="flex h-screen bg-white">
      {/* Left Panel - Agent Interface */}
      <div className="w-1/2 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Apply for Benefits</h2>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-600">
            <LogOut className="w-4 h-4 mr-1" />
            Log out
          </Button>
        </div>

        {/* Browser Prompt Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Browser:</div>
          <div className="text-sm text-gray-800 mb-1">
            Please apply {participantName} to this WIC
          </div>
          <div className="text-xs text-gray-500">Session started 1 minute ago</div>
        </div>

        {/* Suggested Action */}
        <div className="p-4">
          <Button
            onClick={() => onSendMessage(`Apply ${participantName} for WIC benefits using their participant data`)}
            disabled={isReadonly || isProcessing}
            className="w-full bg-pink-100 hover:bg-pink-200 text-pink-800 border border-pink-300 rounded-lg h-12 text-sm font-medium disabled:opacity-50"
          >
            Apply {participantName} for WIC
          </Button>
        </div>

        {/* Agent Messages */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Ready to help with benefit applications</p>
              <p className="text-sm">I can help you apply for WIC, MediCal, and other benefits using your participant data.</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className="space-y-2">
                {message.role === 'assistant' && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Globe className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-800">
                          {message.parts.map((part, partIndex) => (
                            <div key={partIndex} className="mb-2 last:mb-0">
                              {part.type === 'text' ? (
                                <div className="whitespace-pre-wrap">{part.text}</div>
                              ) : (part as any).type === 'tool-call' ? (
                                <div className="text-xs text-blue-600 bg-blue-100 rounded px-2 py-1 inline-block">
                                  🔧 {(part as any).toolName || 'Tool'}
                                </div>
                              ) : (part as any).type === 'tool-result' ? (
                                <div className="text-xs text-green-600 bg-green-100 rounded px-2 py-1 inline-block">
                                  ✅ Tool completed
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {message.role === 'user' && (
                  <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                    <div className="text-sm text-gray-800">
                      {message.parts.map((part, partIndex) => (
                        <div key={partIndex}>
                          {part.type === 'text' ? part.text : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          
          {/* Processing indicator */}
          {isProcessing && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-800">Processing your request...</span>
              </div>
            </div>
          )}
          
          {/* Error display */}
          {error && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Participant Information Card */}
        {/* <div className="p-4 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              {participantName} - WIC Application Information
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div><strong>Name:</strong> {participantName}</div>
              <div><strong>Status:</strong> Ready for WIC application</div>
              <div><strong>Agent:</strong> Web Automation Agent will fetch participant data from database</div>
              <div><strong>Browser:</strong> Live automation view available during application process</div>
            </div>
          </div>
        </div> */}

        {/* Next Step */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Now let me navigate to the WIC application website and begin filling out the form with her data.
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>Captured page screenshot</span>
            <ArrowLeft className="w-3 h-3" />
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder={isProcessing ? "Processing..." : "Ask me to apply for benefits..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
              disabled={isReadonly || isProcessing}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isReadonly || isProcessing}
              className="text-white px-3 disabled:opacity-50"
              style={{ backgroundColor: '#814092' }}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowLeft className="w-4 h-4" />
              )}
            </Button>
          </form>
          
          {/* Quick action buttons */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSendMessage(`Apply ${participantName} for WIC benefits using their participant data`)}
              disabled={isReadonly || isProcessing}
              className="text-xs"
            >
              Apply for WIC
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSendMessage(`Check WIC eligibility for ${participantName} using their participant data`)}
              disabled={isReadonly || isProcessing}
              className="text-xs"
            >
              Check Eligibility
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSendMessage(`Find nearby WIC offices for ${participantName}`)}
              disabled={isReadonly || isProcessing}
              className="text-xs"
            >
              Find Offices
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSendMessage(`Help ${participantName} complete their WIC application form with all their information`)}
              disabled={isReadonly || isProcessing}
              className="text-xs"
            >
              Complete Application
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Browser View */}
      {browserPanelVisible && onToggleBrowserPanel && (
        <div className="w-1/2 flex flex-col">
          <BrowserPanel
            sessionId={browserSessionId}
            isVisible={browserPanelVisible}
            onToggle={onToggleBrowserPanel}
          />
        </div>
      )}
    </div>
  );
}
