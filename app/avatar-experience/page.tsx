'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, PhoneOff, Volume2, VolumeX, X, Mic, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FullScreenOrb } from '@/components/avatar/FullScreenOrb';
import type { State } from '@/components/avatar/types';
import { SuggestionChips } from '@/components/SuggestionChips';
import { suggestionChips } from '@/config/suggestionChips';
import type { SuggestionChip } from '@/components/SuggestionChips';
import { toast } from 'sonner';
import { useGlenChat } from '@/hooks/useGlenChat';
import { allDemoFlows } from '@/config/demoScript';
import { useHeyGenAvatar } from '@/hooks/useHeyGenAvatar';
import { PrioritiesCard } from '@/components/PrioritiesCard';
import InteractiveAvatarWrapper from '@/heygen-avatar/ui/InteractiveAvatar';

export default function AvatarExperiencePage() {
  const router = useRouter();
  const [avatarState, setAvatarState] = useState<State>('idle');
  const [avatarText, setAvatarText] = useState<string>();
  const [callState, setCallState] = useState<'idle' | 'active'>('idle');
  const [muted, setMuted] = useState(false);
  const [mode, setMode] = useState<'avatar' | 'voice' | 'text'>('avatar');
  const [activeFollowUps, setActiveFollowUps] = useState<SuggestionChip[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [showPriorities, setShowPriorities] = useState(false);
  const [prioritiesPinned, setPrioritiesPinned] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [sessionDuration, setSessionDuration] = useState(0);
  const [suggestedQuestion, setSuggestedQuestion] = useState<string | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const transcriptTimeoutRef = useRef<NodeJS.Timeout>();
  const sessionTimerRef = useRef<NodeJS.Timeout>();

  const { sendScriptedMessage, sendLLMMessage, isLoading, conversationHistory } = useGlenChat({
    setAvatarState,
    setAvatarText,
    muted,
    onSummary: setPriorities,
  });

  // HeyGen integration
  const {
    videoRef,
    isConnected,
    startSession,
    stopSession,
  } = useHeyGenAvatar();

  // Auto-show priorities when they're set, auto-hide after 12s unless pinned
  useEffect(() => {
    if (priorities.length > 0) {
      setShowPriorities(true);

      // Clear any existing timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      // Only set timeout if not pinned
      if (!prioritiesPinned) {
        hideTimeoutRef.current = setTimeout(() => {
          setShowPriorities(false);
        }, 12000);
      }
    }

    // Cleanup on unmount
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [priorities, prioritiesPinned]);

  const handleConnect = async () => {
    setCallState('active');
    setAvatarState('listening');
    setSessionDuration(0);
    toast.success('Connected to Glen - listening now');

    // Start session timer
    sessionTimerRef.current = setInterval(() => {
      setSessionDuration((prev) => prev + 1);
    }, 1000);

    // Try to start HeyGen session (optional)
    try {
      await startSession();
    } catch {
      // Silently continue without video avatar
      console.log('Continuing without HeyGen video');
    }
  };

  const handleHangUp = async () => {
    setCallState('idle');
    setAvatarState('idle');

    // Stop session timer
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }

    // Stop HeyGen session
    await stopSession();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    setMuted(!muted);
  };

  const handleClose = () => {
    router.push('/');
  };

  const handleModeChange = (newMode: 'avatar' | 'voice' | 'text') => {
    setMode(newMode);
  };

  const handleChipClick = async (chip: SuggestionChip) => {
    console.log('Chip clicked:', chip);

    // Avatar mode: send to HeyGen avatar via suggestedQuestion
    if (mode === 'avatar') {
      setSuggestedQuestion(chip.text);
      return;
    }

    // For voice modes, show transcript bubble instead of toast
    if (mode !== 'text' && callState === 'active') {
      setUserTranscript(chip.text);

      // Clear previous timeout
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
      }

      // Auto-hide after 3 seconds
      transcriptTimeoutRef.current = setTimeout(() => {
        setUserTranscript('');
      }, 3000);
    }

    // Check if we have a scripted flow for this chip
    const flow = allDemoFlows[chip.id];

    if (flow) {
      // Use scripted response for known topics
      await sendScriptedMessage(flow);
      // Show follow-ups after scripted response
      if (flow.followUps) {
        setActiveFollowUps(flow.followUps);
      }
    } else {
      // Fall back to LLM for unknown/new chips
      await sendLLMMessage(chip.text);
      // Clear follow-ups for LLM responses
      setActiveFollowUps([]);
    }
  };

  const handleTextSend = async () => {
    if (!textInput.trim() || isLoading) return;

    const message = textInput.trim();
    setTextInput('');

    // Check if there's a matching scripted flow
    const flow = Object.values(allDemoFlows).find(f =>
      f.userPrompt.toLowerCase().includes(message.toLowerCase()) ||
      message.toLowerCase().includes(f.title.toLowerCase())
    );

    if (flow) {
      await sendScriptedMessage(flow);
      if (flow.followUps) {
        setActiveFollowUps(flow.followUps);
      }
    } else {
      await sendLLMMessage(message);
      setActiveFollowUps([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSend();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  return (
    <motion.div
      initial={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col bg-background"
      style={{
        background: 'linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--background) / 0.95) 100%)',
      }}
    >
      {/* Top Bar */}
      <div className="h-16 border-b border-white/10 px-4 grid grid-cols-3 items-center bg-background/80 backdrop-blur-xl sticky top-0 z-20">
        {/* Left: Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={mode === 'avatar' ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => handleModeChange('avatar')}
          >
            <Video className="mr-2 h-4 w-4" />
            Avatar
          </Button>
          <Button
            variant={mode === 'voice' ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => handleModeChange('voice')}
          >
            <Mic className="mr-2 h-4 w-4" />
            Voice
          </Button>
          <Button
            variant={mode === 'text' ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => handleModeChange('text')}
          >
            Text
          </Button>
        </div>

        {/* Center: Session Status */}
        <div className="flex justify-center">
          {mode !== 'text' && callState === 'active' && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-green-600">
                Connected {formatDuration(sessionDuration)}
              </span>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Center Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 overflow-hidden" style={mode === 'avatar' ? { overflow: 'visible' } : {}}>
        {/* Text Mode: Chat Interface */}
        {mode === 'text' ? (
          <div className="flex-1 w-full max-w-3xl flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
              {conversationHistory.length === 0 ? (
                <div className="text-center py-12 space-y-8">
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      GT
                    </div>
                    <p className="text-2xl font-semibold mb-2">Chat with Glen</p>
                    <p className="text-sm text-muted-foreground">Healthcare leader & AI assistant</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <motion.button
                      onClick={() => handleChipClick({ id: 'prep-oncology', text: 'Prep: Oncology meeting', category: 'tactical' })}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="text-left p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 hover:border-green-500/40 transition-colors"
                    >
                      <p className="font-medium mb-1">Prep for a meeting</p>
                      <p className="text-xs text-muted-foreground">Get tactical guidance</p>
                    </motion.button>

                    <motion.button
                      onClick={() => handleChipClick({ id: 'leadership-lesson', text: "What's your biggest leadership lesson?", category: 'leadership' })}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="text-left p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors"
                    >
                      <p className="font-medium mb-1">Leadership wisdom</p>
                      <p className="text-xs text-muted-foreground">Learn from experience</p>
                    </motion.button>

                    <motion.button
                      onClick={() => handleChipClick({ id: 'humans-vs-ai', text: 'What makes humans unique versus AI?', category: 'strategy' })}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="text-left p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 hover:border-blue-500/40 transition-colors"
                    >
                      <p className="font-medium mb-1">Strategy & vision</p>
                      <p className="text-xs text-muted-foreground">Think bigger picture</p>
                    </motion.button>

                    <motion.button
                      onClick={() => handleChipClick({ id: 'twin-time-save', text: 'How could Glen AI save you time today?', category: 'tactical' })}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="text-left p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
                    >
                      <p className="font-medium mb-1">Glen AI ROI</p>
                      <p className="text-xs text-muted-foreground">Maximize your impact</p>
                    </motion.button>
                  </div>
                </div>
              ) : (
                conversationHistory.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 mt-1">
                        GT
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className={`text-xs text-muted-foreground ${msg.role === 'user' ? 'text-right' : 'text-left'} px-2`}>
                        {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold flex-shrink-0 mt-1">
                        You
                      </div>
                    )}
                  </motion.div>
                ))
              )}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t bg-background p-4">
              <div className="flex gap-2">
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Glen..."
                  disabled={isLoading}
                  className="min-h-[60px] resize-none"
                />
                <Button
                  size="icon"
                  onClick={handleTextSend}
                  disabled={isLoading || !textInput.trim()}
                  className="h-[60px] w-[60px]"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        ) : mode === 'avatar' ? (
          /* Avatar Mode: HeyGen Interactive Avatar */
          <InteractiveAvatarWrapper
            suggestedQuestion={suggestedQuestion}
            setSelectedSuggestedQuestion={setSuggestedQuestion}
          />
        ) : (
          /* Voice Mode: Orb */
          <>
            {/* User Transcript Bubble */}
            {userTranscript && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-24 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg max-w-md text-center z-10"
              >
                <p className="text-sm font-medium">You: "{userTranscript}"</p>
              </motion.div>
            )}

            {/* Listening Indicator - when connected and actively listening */}
            {callState === 'active' && avatarState === 'listening' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 mb-4"
              >
                <div className="flex gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 bg-green-500 rounded-full"
                      animate={{
                        height: [12, 24, 12],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm text-green-600 font-medium">Listening...</p>
              </motion.div>
            )}

            <FullScreenOrb
              state={avatarState}
              text={avatarText}
              size={350}
              showAvatar={true}
              videoRef={videoRef}
              isConnected={isConnected}
              className={isLoading ? 'animate-pulse' : ''}
            />
            {isLoading && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground italic"
              >
                Glen is thinking...
              </motion.p>
            )}
          </>
        )}

        {/* Call Button - show for voice mode only */}
        {mode === 'voice' && (
          <Button
            onClick={callState === 'idle' ? handleConnect : handleHangUp}
            disabled={isLoading}
            className={`h-14 w-48 rounded-full text-lg font-semibold ${
              callState === 'idle'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {callState === 'idle' ? (
              <>
                <Mic className="mr-2 h-5 w-5" />
                Connect
              </>
            ) : (
              <>
                <PhoneOff className="mr-2 h-5 w-5" />
                Hang Up
              </>
            )}
          </Button>
        )}
      </div>

      {/* Bottom Suggestion Chips - show in voice and avatar modes */}
      {(mode === 'voice' || mode === 'avatar') && (
        <div className="flex flex-col">
          {activeFollowUps.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFollowUps([])}
              className="mb-2 ml-4 self-start"
            >
              ← Back to topics
            </Button>
          )}
          <SuggestionChips
            chips={activeFollowUps.length > 0 ? activeFollowUps : suggestionChips}
            onChipClick={isLoading ? () => {} : handleChipClick}
            className={isLoading ? 'opacity-50 pointer-events-none' : ''}
          />
        </div>
      )}

      {/* Priorities Card - position higher in text mode to avoid covering input */}
      <div className={mode === 'text' ? 'mb-32' : ''}>
        <PrioritiesCard
          priorities={priorities}
          show={showPriorities}
          onClose={() => setShowPriorities(false)}
          pinned={prioritiesPinned}
          onPinChange={setPrioritiesPinned}
          isLoading={isLoading}
        />
      </div>
    </motion.div>
  );
}