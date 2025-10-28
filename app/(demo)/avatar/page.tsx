"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Mic,
  Pause,
  PhoneOff,
  Play,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FullScreenOrb } from "@/components/avatar/FullScreenOrb";
import type { State } from "@/components/avatar/types";
import ContextDrawer from "@/components/ContextDrawer";
import { PrioritiesCard } from "@/components/PrioritiesCard";
import type { SuggestionChip } from "@/components/SuggestionChips";
import { SuggestionChips } from "@/components/SuggestionChips";
import { TranscriptView } from "@/components/TranscriptView";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import VideoLoop from "@/components/VideoLoop";
import { allDemoFlows } from "@/config/demoScript";
import { suggestionChips } from "@/config/suggestionChips";
import { useGlenChat } from "@/hooks/useGlenChat";
import { useHeyGenAvatar } from "@/hooks/useHeyGenAvatar";

export default function AvatarExperiencePage() {
  const [avatarState, setAvatarState] = useState<State>("idle");
  const [avatarText, setAvatarText] = useState<string>();
  const [callState, setCallState] = useState<"idle" | "active">("idle");
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [mode] = useState<"avatar" | "voice" | "text">("avatar");
  const [activeFollowUps, setActiveFollowUps] = useState<SuggestionChip[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [showPriorities, setShowPriorities] = useState(false);
  const [prioritiesPinned, setPrioritiesPinned] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const [hasStartedConversation, setHasStartedConversation] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const transcriptTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    sendScriptedMessage,
    sendLLMMessage,
    isLoading,
    conversationHistory,
  } = useGlenChat({
    setAvatarState,
    setAvatarText,
    muted,
    onSummary: setPriorities,
  });

  // HeyGen integration
  const { videoRef, isConnected, startSession, stopSession } =
    useHeyGenAvatar();

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
        }, 12_000);
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
    setCallState("active");
    setAvatarState("listening");
    toast.success("Connected to Glen - listening now");

    // Try to start HeyGen session (optional)
    try {
      await startSession();
    } catch {
      // Silently continue without video avatar
      console.log("Continuing without HeyGen video");
    }
  };

  const handleHangUp = async () => {
    setCallState("idle");
    setAvatarState("idle");

    // Stop HeyGen session
    await stopSession();
  };

  const toggleMute = () => {
    setMuted(!muted);
  };

  const handleChipClick = async (chip: SuggestionChip) => {
    console.log("Chip clicked:", chip);

    // Mark conversation as started
    setHasStartedConversation(true);

    // In avatar mode, just show the chip was clicked - don't actually execute anything
    if (mode === "avatar") {
      // Show a brief visual feedback (optional)
      console.log("Avatar mode: Chip clicked but not executing:", chip.text);
      return;
    }

    // For voice modes, show transcript bubble instead of toast
    if (mode !== "text" && callState === "active") {
      setUserTranscript(chip.text);

      // Clear previous timeout
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
      }

      // Auto-hide after 3 seconds
      transcriptTimeoutRef.current = setTimeout(() => {
        setUserTranscript("");
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
    if (!textInput.trim() || isLoading) {
      return;
    }

    const message = textInput.trim();
    setTextInput("");

    // Check if there's a matching scripted flow
    const flow = Object.values(allDemoFlows).find(
      (f) =>
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTextSend();
    }
  };

  // Auto-scroll disabled for now

  return (
    <motion.div
      animate={{ opacity: 1, translateY: 0 }}
      className="flex min-h-screen flex-col bg-background"
      initial={{ opacity: 0, translateY: 20 }}
      style={{
        background:
          "linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--background) / 0.95) 100%)",
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with context */}
      <div className="flex h-16 items-center justify-center border-b px-4 md:px-6">
        <div className="flex w-full items-center justify-between">
          <div className="flex-1" />
          <h1 className="font-semibold text-2xl">Glen AI</h1>
          <div className="flex flex-1 items-center justify-end gap-2">
            {conversationHistory.length > 0 && (
              <Button
                onClick={() => setTranscriptOpen(true)}
                size="sm"
                variant="outline"
              >
                <FileText className="mr-2 h-4 w-4" />
                Transcript
              </Button>
            )}
            <ContextDrawer />
          </div>
        </div>
      </div>
      {/* Center Content Area */}
      <div
        className="flex flex-1 flex-col items-center justify-center gap-8 overflow-hidden"
        style={mode === "avatar" ? { overflow: "visible" } : {}}
      >
        {/* Text Mode: Chat Interface */}
        {mode === "text" ? (
          <div className="flex w-full max-w-3xl flex-1 flex-col">
            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
              {conversationHistory.length === 0 ? (
                <div className="space-y-8 py-12 text-center">
                  <div>
                    <p className="mb-2 font-semibold text-2xl">
                      Chat with Glen
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Healthcare leader & AI assistant
                    </p>
                  </div>

                  <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                    <motion.button
                      className="rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-green-600/5 p-4 text-left transition-colors hover:border-green-500/40"
                      onClick={() =>
                        handleChipClick({
                          id: "prep-oncology",
                          text: "Prep: Oncology meeting",
                          category: "tactical",
                        })
                      }
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <p className="mb-1 font-medium">Prep for a meeting</p>
                      <p className="text-muted-foreground text-xs">
                        Get tactical guidance
                      </p>
                    </motion.button>

                    <motion.button
                      className="rounded-xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 p-4 text-left transition-colors hover:border-yellow-500/40"
                      onClick={() =>
                        handleChipClick({
                          id: "leadership-lesson",
                          text: "What's your biggest leadership lesson?",
                          category: "leadership",
                        })
                      }
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <p className="mb-1 font-medium">Leadership wisdom</p>
                      <p className="text-muted-foreground text-xs">
                        Learn from experience
                      </p>
                    </motion.button>

                    <motion.button
                      className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4 text-left transition-colors hover:border-blue-500/40"
                      onClick={() =>
                        handleChipClick({
                          id: "humans-vs-ai",
                          text: "What makes humans unique versus AI?",
                          category: "strategy",
                        })
                      }
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <p className="mb-1 font-medium">Strategy & vision</p>
                      <p className="text-muted-foreground text-xs">
                        Think bigger picture
                      </p>
                    </motion.button>

                    <motion.button
                      className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4 text-left transition-colors hover:border-purple-500/40"
                      onClick={() =>
                        handleChipClick({
                          id: "twin-time-save",
                          text: "How could Glen AI save you time today?",
                          category: "tactical",
                        })
                      }
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <p className="mb-1 font-medium">AI Assistant ROI</p>
                      <p className="text-muted-foreground text-xs">
                        Maximize your impact
                      </p>
                    </motion.button>
                  </div>
                </div>
              ) : (
                conversationHistory.map((msg) => (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    initial={{ opacity: 0, y: 10 }}
                    key={`${msg.role}-${msg.content}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-semibold text-sm text-white">
                        G
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span
                        className={`text-muted-foreground text-xs ${msg.role === "user" ? "text-right" : "text-left"} px-2`}
                      >
                        {new Date().toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {msg.role === "user" && (
                      <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-sm">
                        You
                      </div>
                    )}
                  </motion.div>
                ))
              )}
              {isLoading && (
                <motion.div
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                >
                  <div className="rounded-2xl bg-muted px-4 py-3">
                    <div className="flex gap-1">
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-foreground/40"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-foreground/40"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-foreground/40"
                        style={{ animationDelay: "300ms" }}
                      />
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
                  className="min-h-[60px] resize-none"
                  disabled={isLoading}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Glen..."
                  value={textInput}
                />
                <Button
                  className="h-[60px] w-[60px]"
                  disabled={isLoading || !textInput.trim()}
                  onClick={handleTextSend}
                  size="icon"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        ) : mode === "avatar" ? (
          /* Avatar Mode: Static Glen Image */
          hasStartedConversation ? (
            <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-6">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  alt="Glen Tullman"
                  className="object-cover"
                  fill
                  priority={false}
                  sizes="100vw"
                  src="/Glen-Tullman2.jpg"
                />
                <div
                  className="absolute bottom-4 left-1/2 flex gap-2"
                  style={{ transform: "translateX(-50%)" }}
                >
                  <Button
                    onClick={() => setPaused(!paused)}
                    size="icon"
                    variant="secondary"
                  >
                    {paused ? <Play /> : <Pause />}
                  </Button>
                  <Button onClick={toggleMute} size="icon" variant="secondary">
                    {muted ? <VolumeX /> : <Volume2 />}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center overflow-hidden">
              {/* Video Background */}
              <div className="absolute inset-0 z-0">
                <VideoLoop
                  blur={3}
                  mask="none"
                  showGlen={false}
                  src="/videos/glen-loop.mp4"
                />
              </div>

              {/* Dark Overlay for Text Readability */}
              <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />

              {/* Content */}
              <div className="relative z-20 flex flex-col items-center gap-6 text-center">
                <div className="space-y-4">
                  <h2 className="font-bold text-4xl text-white md:text-5xl">Glen AI</h2>
                  <p className="mx-auto max-w-md text-lg text-white/90 md:text-xl">
                    Start a video conversation with Glen's AI assistant
                  </p>
                </div>
                <Button
                  className="relative rounded-full bg-emerald-500 px-8 py-6 font-semibold text-lg text-white shadow-2xl transition-all duration-200 hover:scale-105 hover:bg-emerald-600 hover:shadow-[0_0_0_4px_rgba(16,185,129,0.2)]"
                  onClick={() => setHasStartedConversation(true)}
                  size="lg"
                  type="button"
                  variant="default"
                >
                  Start Video Chat
                </Button>
              </div>
            </div>
          )
        ) : (
          /* Voice Mode: Orb */
          <>
            {/* User Transcript Bubble */}
            {userTranscript && (
              <motion.div
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="-translate-x-1/2 absolute top-24 left-1/2 z-10 max-w-md rounded-full bg-primary px-4 py-2 text-center text-primary-foreground shadow-lg"
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
              >
                <p className="font-medium text-sm">You: "{userTranscript}"</p>
              </motion.div>
            )}

            {/* Listening Indicator - when connected and actively listening */}
            {callState === "active" && avatarState === "listening" && (
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 flex flex-col items-center gap-3"
                initial={{ opacity: 0, scale: 0.9 }}
              >
                <div className="flex gap-1.5">
                  {["bar-0", "bar-1", "bar-2", "bar-3", "bar-4"].map(
                    (id, i) => (
                      <motion.div
                        animate={{
                          height: [12, 24, 12],
                        }}
                        className="w-1.5 rounded-full bg-green-500"
                        key={id}
                        transition={{
                          duration: 1.2,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: i * 0.15,
                          ease: "easeInOut",
                        }}
                      />
                    )
                  )}
                </div>
                <p className="font-medium text-green-600 text-sm">
                  Listening...
                </p>
              </motion.div>
            )}

            <FullScreenOrb
              className={isLoading ? "animate-pulse" : ""}
              isConnected={isConnected}
              showAvatar={true}
              size={350}
              state={avatarState}
              text={avatarText}
              videoRef={videoRef}
            />
            {isLoading && (
              <motion.p
                animate={{ opacity: 1 }}
                className="text-muted-foreground text-sm italic"
                initial={{ opacity: 0 }}
              >
                Glen is thinking...
              </motion.p>
            )}
          </>
        )}

        {/* Call Button - show for voice mode only */}
        {mode === "voice" && (
          <Button
            className={`h-14 w-48 rounded-full font-semibold text-lg ${
              callState === "idle"
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
            disabled={isLoading}
            onClick={callState === "idle" ? handleConnect : handleHangUp}
          >
            {callState === "idle" ? (
              <>
                <Mic className="h-5 w-5" />
                Connect
              </>
            ) : (
              <>
                <PhoneOff className="h-5 w-5" />
                Hang Up
              </>
            )}
          </Button>
        )}
      </div>

      {/* Bottom Suggestion Chips - show in avatar mode after starting, or in voice mode after conversation starts */}
      {((mode === "avatar" && hasStartedConversation) ||
        (mode === "voice" && hasStartedConversation)) && (
        <div className="flex flex-col pb-6">
          {activeFollowUps.length > 0 && (
            <Button
              className="mb-2 ml-4 self-start"
              onClick={() => setActiveFollowUps([])}
              size="sm"
              variant="ghost"
            >
              ← Back to topics
            </Button>
          )}
          <SuggestionChips
            chips={
              activeFollowUps.length > 0
                ? activeFollowUps
                : suggestionChips.slice(0, 4)
            }
            className={isLoading ? "pointer-events-none opacity-50" : ""}
            onChipClick={isLoading ? () => null : handleChipClick}
          />
        </div>
      )}

      {/* Priorities Card - position higher in text mode to avoid covering input */}
      <div className={mode === "text" ? "mb-32" : ""}>
        <PrioritiesCard
          isLoading={isLoading}
          onClose={() => setShowPriorities(false)}
          onPinChange={setPrioritiesPinned}
          pinned={prioritiesPinned}
          priorities={priorities}
          show={showPriorities}
        />
      </div>

      {/* Transcript View */}
      <TranscriptView
        conversationHistory={conversationHistory}
        onOpenChange={setTranscriptOpen}
        open={transcriptOpen}
      />
    </motion.div>
  );
}
