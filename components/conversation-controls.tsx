'use client';

import { MuteIcon, UnmuteIcon, StartCallIcon, EndCallIcon, SpeechIcon } from './icons';
import { Button } from './ui/button';

interface ConversationControlsProps {
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
  onMuteToggle: () => void;
  isConnected: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  conversationId: string;
}

export function ConversationControls({
  onStart,
  onStop,
  onMuteToggle,
  isConnected,
  isSpeaking,
  isMuted,
  conversationId,
}: ConversationControlsProps) {
  return (
    <div className="flex flex-col items-center gap-2">
        
        {!isConnected ? (<div className="text-center">
                <p className="text-muted-foreground dark:text-gray-400 flex items-center justify-center gap-2">
                    <SpeechIcon size={16} />
                    CoCo is ready to help you!
                </p>
            </div>
        ) : (<div className="text-center">
            <p className="text-muted-foreground dark:text-gray-400 flex items-center justify-center gap-2">
                <SpeechIcon size={16} />
                {isMuted && '(Muted) | '}{isSpeaking ? 'Talk to Interupt' : 'Listening to you...'}
            </p>
            {/* {conversationId && (
            <p className="text-xs text-gray-500 mt-2">
                Conversation ID: {conversationId}
            </p>
            )} */}
        </div>
        )}
        
        <div className="flex gap-4">
            {!isConnected ? (
            <Button
                onClick={onStart}
                variant="default"
                size="lg"
                className="text-white rounded-full bg-gradient-to-r from-[#3a86ff] to-[#00b24b] hover:from-[#3a86ff]/90 hover:to-[#00b24b]/90 dark:from-[#3a86ff] dark:to-[#00b24b] dark:hover:from-[#3a86ff]/90 dark:hover:to-[#00b24b]/90"
            >
                <StartCallIcon size={20} />
                Start Call
            </Button>
            ) : (
            <>
                <Button
                onClick={onMuteToggle}
                variant={isMuted ? "outline" : "outline"}
                size="lg"
                className="text-foreground rounded-full border-border hover:bg-muted dark:text-white dark:border-white dark:hover:bg-muted/50"
                >
                {isMuted ? <UnmuteIcon size={20} /> : <MuteIcon size={20} />}
                {isMuted ? 'Unmute' : 'Mute'}
                </Button>
                <Button
                onClick={onStop}
                variant="destructive"
                size="lg"
                className="text-white rounded-full bg-destructive hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/90"
                >
                <EndCallIcon size={20} />
                End Call
                </Button>
            </>
            )}
        </div>
        
        <p className="text-xs text-center text-muted-foreground dark:text-gray-400 mt-2 italic">
        Disclaimer: CoCo is an AI assistant and does not provide advice. Please consult with our professional coach.
        </p>
    </div>
  );
} 