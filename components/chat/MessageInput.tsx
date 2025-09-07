'use client';

import React from 'react';
import { Send, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onInterrupt?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
}

export const MessageInput = React.forwardRef<HTMLTextAreaElement, MessageInputProps>(({
  onSendMessage,
  onInterrupt,
  isStreaming = false,
  disabled = false,
  placeholder = "Digite sua mensagem... (Enter para enviar)",
  onFocus,
  onBlur,
  className
}, ref) => {
  const [message, setMessage] = React.useState('');
  const internalRef = React.useRef<HTMLTextAreaElement>(null);
  const textareaRef = ref || internalRef;

  const handleSend = () => {
    if (message.trim() && !disabled && !isStreaming) {
      onSendMessage(message.trim());
      setMessage('');
      if (typeof textareaRef === 'object' && textareaRef?.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustHeight = () => {
    if (typeof textareaRef === 'object' && textareaRef?.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  React.useEffect(() => {
    adjustHeight();
  }, [message]);

  return (
    <div className="relative border-t bg-background p-4">
      <div className="mx-auto max-w-4xl">
        <div className="relative flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef as any}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder={placeholder}
              disabled={disabled || isStreaming}
              className={cn(
                className,
                "w-full resize-none rounded-lg border bg-background px-4 py-3 pr-12",
                "text-sm placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "min-h-[52px] max-h-[200px]"
              )}
              rows={1}
            />
            
            {message.length > 0 && (
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                <span>{message.length}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {isStreaming ? (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={onInterrupt}
                className="h-[52px] w-[52px]"
                title="Interromper"
              >
                <Square className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                size="icon"
                onClick={handleSend}
                disabled={disabled || !message.trim()}
                className="h-[52px] w-[52px]"
                title="Enviar"
              >
                <Send className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';