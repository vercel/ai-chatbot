'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ChatMessage } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { SuggestedActions } from '@/components/suggested-actions';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';
import { useState } from 'react';

interface BenefitApplicationsLandingProps {
  onSendMessage: (message: string) => void;
  isReadonly?: boolean;
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  selectedVisibilityType: VisibilityType;
}

export function BenefitApplicationsLanding({ 
  onSendMessage, 
  isReadonly = false, 
  chatId, 
  sendMessage, 
  selectedVisibilityType 
}: BenefitApplicationsLandingProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isReadonly) {
      onSendMessage(input.trim());
    }
  };


  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8" style={{ backgroundColor: '#F4E4F0' }}>
      <div className="max-w-4xl w-full text-left">
        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-purple-900 mb-16 leading-tight">
          Get started on
          <br />
          benefit applications
        </h1>
        
        {/* Question */}
        <p className="text-2xl text-gray-800 mb-4">
          What program would you like to apply for?
        </p>

        {/* Suggested Actions */}
        <div className="w-full max-w-4xl">
          <SuggestedActions
            chatId={chatId}
            sendMessage={sendMessage}
            selectedVisibilityType={selectedVisibilityType}
          />
        </div>
        <br />

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-8 max-w-4xl mx-auto">
          <div className="relative">
            <textarea
              placeholder="Write something"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full min-h-[80px] max-h-40 text-lg border-2 border-purple-300 rounded-lg pr-14 resize-vertical p-4"
              style={{ 
                borderColor: '#D1D5DB',
                '--tw-ring-color': '#814092'
              } as React.CSSProperties}
              onFocus={(e) => e.target.style.borderColor = '#814092'}
              onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              disabled={isReadonly}
              rows={3}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isReadonly}
              className="absolute bottom-3 right-3 h-10 w-10 rounded-full text-white p-0 flex items-center justify-center"
              style={{ backgroundColor: '#814092' }}
              tabIndex={-1}
            >
              <ArrowRight className="w-6 h-6" />
            </Button>
          </div>
        </form>

        {/* Watermark */}
        <div className="absolute bottom-4 right-4 text-sm text-gray-500">
          image
        </div>
      </div>
    </div>
  );
}
