"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import {
  LiveConnectionState,
  LiveTranscriptionEvents,
  useDeepgram,
} from "@/app/context/deepgram-context-provider";
import {
  MicrophoneEvents,
  MicrophoneState,
  useMicrophone,
} from "@/app/context/microphone-context-provider";
import { ChatHeader } from "@/components/chat-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useCartesiaTTS } from "@/hooks/use-cartesia-tts";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import { usePlayer } from "@/hooks/use-player";
import { useVoiceSettings } from "@/hooks/use-voice-settings";
import type { Vote } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { Attachment, ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { Artifact } from "./artifact";
import { useDataStream } from "./data-stream-provider";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { toast } from "./toast";
import type { VisibilityType } from "./visibility-selector";
import { VoiceAgentOverlay, type VoiceAgentState } from "./voice-agent-overlay";

// EOT detection regexes (top-level to avoid re-creation)
const END_PUNCT_REGEX = /[.!?]$/;
const WHITESPACE_REGEX = /\s+/;
const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  autoResume,
  initialLastContext,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume: boolean;
  initialLastContext?: AppUsage;
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>("");
  const [usage, setUsage] = useState<AppUsage | undefined>(initialLastContext);
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);

  // Voice functionality - only enable after client-side mount to avoid hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  const player = usePlayer();
  const cartesiaTTS = useCartesiaTTS(); // Client-side TTS for voice agent mode
  const { ttsEnabled, voiceAgentEnabled, setVoiceAgentEnabled } =
    useVoiceSettings();

  // Check if artifact panel is visible (needed early for voice agent logic)
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  // Voice Agent state
  const [voiceAgentActive, setVoiceAgentActive] = useState(false);
  const [voiceAgentState, setVoiceAgentState] =
    useState<VoiceAgentState>("idle");
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [accumulatedTranscript, setAccumulatedTranscript] = useState("");
  const justInterruptedRef = useRef(false); // Flag: just interrupted, ignore next transcripts

  // Deepgram and Microphone contexts (from working demo)
  const {
    connection,
    connectToDeepgram,
    disconnectFromDeepgram,
    connectionState,
  } = useDeepgram();
  const {
    setupMicrophone,
    microphone,
    startMicrophone,
    stopMicrophone,
    microphoneState,
    mediaStream,
  } = useMicrophone();

  // Track if we've already set things up to prevent infinite loops
  const hasMicSetupRef = useRef(false);
  const hasConnectedRef = useRef(false);
  const lastSubmittedRef = useRef<string>("");
  const lastSubmittedTimestampRef = useRef<number>(0);
  const eotDetectionInProgressRef = useRef(false);
  const lastAutoPlayedMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

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
      api: "/api/chat",
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        return {
          body: {
            id: request.id,
            message: request.messages.at(-1),
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: visibilityType,
            ...request.body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
      if (dataPart.type === "data-usage") {
        setUsage(dataPart.data);
      }
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        // Check if it's a credit card error
        if (
          error.message?.includes("AI Gateway requires a valid credit card")
        ) {
          setShowCreditCardAlert(true);
        } else {
          toast({
            type: "error",
            description: error.message,
          });
        }
      }
    },
  });

  // Track AI response status for voice agent states
  useEffect(() => {
    if (!voiceAgentActive) {
      return;
    }

    if (status === "streaming") {
      // AI is responding
      setVoiceAgentState("speaking");
    } else if (status === "ready" && voiceAgentState === "speaking") {
      // AI finished speaking, back to listening
      setVoiceAgentState("listening");
    }
  }, [status, voiceAgentActive, voiceAgentState]);

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        role: "user" as const,
        parts: [{ type: "text", text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, "", `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  // Setup microphone when component mounts - ONCE
  useEffect(() => {
    if (voiceAgentEnabled && !hasMicSetupRef.current) {
      if (DEBUG) {
        console.log("Setting up microphone...");
      }
      setupMicrophone();
      hasMicSetupRef.current = true;
    }
  }, [voiceAgentEnabled, setupMicrophone]);

  // Connect to Deepgram when microphone is ready - ONCE
  useEffect(() => {
    if (
      voiceAgentEnabled &&
      microphoneState === MicrophoneState.Ready &&
      !hasConnectedRef.current
    ) {
      if (DEBUG) {
        console.log("Connecting to Deepgram...");
      }
      connectToDeepgram({
        model: "nova-2",
        interim_results: true,
        smart_format: true,
        utterance_end_ms: 1000,
        vad_events: true,
      });
      setVoiceAgentActive(true);
      setVoiceAgentState("listening");
      hasConnectedRef.current = true;
    }
  }, [voiceAgentEnabled, microphoneState, connectToDeepgram]);

  // Handle transcription events and audio streaming
  useEffect(() => {
    if (
      !microphone ||
      !connection ||
      connectionState !== LiveConnectionState.open
    ) {
      return;
    }

    const onData = (e: BlobEvent) => {
      if (e.data.size > 0) {
        connection.send(e.data);
      }
    };

    const onTranscript = (data: any) => {
      const transcript = data.channel?.alternatives?.[0]?.transcript || "";
      const isFinal = data.speech_final || false;

      if (!transcript) {
        return;
      }

      if (DEBUG) {
        console.log(`Deepgram ${isFinal ? "FINAL" : "partial"}:`, transcript);
      }

      // Ignore transcripts right after an interrupt (prevents loop)
      if (justInterruptedRef.current) {
        if (DEBUG) {
          console.log(
            `Voice Agent: Ignoring transcript after interrupt (isFinal=${isFinal}): "${transcript.substring(0, 20)}"`
          );
        }
        // Clear flag on FINAL transcript (interrupt utterance ended)
        if (isFinal) {
          if (DEBUG) {
            console.log(
              "Voice Agent: Interrupt utterance FINAL - clearing flag, re-enabling transcripts"
            );
          }
          justInterruptedRef.current = false;
        }
        return;
      }

      // INTERRUPT: If user starts speaking while AI audio is playing OR queued, STOP IMMEDIATELY!
      const isCurrentlyPlaying = cartesiaTTS.isPlayingRef.current;
      const isSynthesizing = cartesiaTTS.isSynthesizingRef?.current || false;

      console.log(
        `Voice Agent: Interrupt check - isPlaying=${isCurrentlyPlaying}, isSynthesizing=${isSynthesizing}, transcript="${transcript.substring(0, 20)}"`
      );

      if (
        (isCurrentlyPlaying || isSynthesizing) &&
        transcript.trim().length > 0
      ) {
        justInterruptedRef.current = true; // Set flag to ignore next transcripts
        if (DEBUG) {
          console.log(
            `Voice Agent: ⚠️ USER INTERRUPTED (timestamp=${Date.now()}) - Stopping TTS NOW!`
          );
        }
        // Stop audio completely
        cartesiaTTS.stop();
        // CRITICAL: Clear accumulated transcript so interrupt doesn't get submitted as new message!
        setAccumulatedTranscript("");
        setPartialTranscript("");
        // Back to listening
        setVoiceAgentState("listening");
        // Also stop the LLM if it's still generating
        if (status === "streaming") {
          if (DEBUG) {
            console.log("User interrupted - stopping LLM");
          }
          stop();
        }
        // Don't process this transcript - it was an interrupt, not a new message
        return;
      }

      if (isFinal) {
        // Use callback form of setState to get current value
        setAccumulatedTranscript((currentAccumulated) => {
          const newAccumulated = currentAccumulated
            ? `${currentAccumulated} ${transcript}`
            : transcript;

          // Prevent duplicate submissions - check if already submitted OR in progress
          if (
            lastSubmittedRef.current === newAccumulated ||
            eotDetectionInProgressRef.current
          ) {
            if (DEBUG) {
              console.log("Skipping duplicate EOT detection:", {
                alreadySubmitted: lastSubmittedRef.current === newAccumulated,
                inProgress: eotDetectionInProgressRef.current,
              });
            }
            return newAccumulated;
          }

          // Mark EOT detection as in progress BEFORE any async operations
          eotDetectionInProgressRef.current = true;

          // Check for EOT using nlp-worker API
          // Note: This API gracefully falls back to heuristics if NLP Worker is unavailable
          fetch("/api/voice/detect-eot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chatHistory: [{ role: "user", content: newAccumulated }],
            }),
          })
            .then((res) => res.json())
            .then((result) => {
              const eotDetected =
                result.is_end_of_utterance || result.eot_detected || false;
              const probability =
                result.eou_probability || result.eot_probability || 0;
              const usingFallback = result._fallback || false;
              const method = result._method || "unknown";

              if (DEBUG) {
                console.log(
                  `EOT ${method}: detected=${eotDetected}, prob=${probability.toFixed(3)}${usingFallback ? " (fallback)" : ""}`
                );
              }

              // Double-check before submission to prevent race conditions
              const now = Date.now();
              const timeSinceLastSubmit =
                now - lastSubmittedTimestampRef.current;

              // Prevent submitting the same text, or any text within 500ms of the last submission
              if (
                eotDetected &&
                lastSubmittedRef.current !== newAccumulated &&
                timeSinceLastSubmit > 500
              ) {
                // Set the ref BEFORE sending to prevent any race conditions
                lastSubmittedRef.current = newAccumulated;
                lastSubmittedTimestampRef.current = now;

                if (DEBUG) {
                  console.log("Submitting message:", newAccumulated);
                }
                setVoiceAgentState("processing");

                sendMessage({
                  role: "user",
                  parts: [{ type: "text", text: newAccumulated }],
                });

                setPartialTranscript("");
                setAccumulatedTranscript("");
              } else if (eotDetected && DEBUG) {
                console.log("EOT detected but skipping:", {
                  alreadySubmitted: lastSubmittedRef.current === newAccumulated,
                  tooSoon: timeSinceLastSubmit <= 500,
                  timeSinceLastSubmit,
                });
              }

              eotDetectionInProgressRef.current = false;
            })
            .catch((err) => {
              // This should rarely happen since the API returns fallback on errors
              if (DEBUG) {
                console.warn(
                  "EOT API unreachable, using client-side heuristic:",
                  err
                );
              }

              // Client-side fallback heuristic (last resort)
              const hasEndPunctuation = END_PUNCT_REGEX.test(transcript.trim());
              const wordCount = transcript
                .trim()
                .split(WHITESPACE_REGEX).length;

              const now = Date.now();
              const timeSinceLastSubmit =
                now - lastSubmittedTimestampRef.current;

              // Double-check before submission
              if (
                hasEndPunctuation &&
                wordCount >= 3 &&
                lastSubmittedRef.current !== newAccumulated &&
                timeSinceLastSubmit > 500
              ) {
                // Set the ref BEFORE sending to prevent any race conditions
                lastSubmittedRef.current = newAccumulated;
                lastSubmittedTimestampRef.current = now;

                if (DEBUG) {
                  console.log("EOT fallback, submitting:", newAccumulated);
                }
                setVoiceAgentState("processing");

                sendMessage({
                  role: "user",
                  parts: [{ type: "text", text: newAccumulated }],
                });

                setPartialTranscript("");
                setAccumulatedTranscript("");
              }

              eotDetectionInProgressRef.current = false;
            });

          return newAccumulated;
        });
      } else {
        // Partial transcript - update UI
        setPartialTranscript(transcript);

        // First partial = interrupt
        if (status === "streaming") {
          if (DEBUG) {
            console.log("User interrupted - stopping LLM");
          }
          stop();
          player?.stop();
        }
      }
    };

    // Add event listeners
    connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
    microphone.addEventListener(MicrophoneEvents.DataAvailable, onData);

    // Only start if not already recording or paused
    if (microphone.state !== "recording" && microphone.state !== "paused") {
      startMicrophone();
    }

    return () => {
      connection?.removeListener(
        LiveTranscriptionEvents.Transcript,
        onTranscript
      );
      microphone?.removeEventListener(MicrophoneEvents.DataAvailable, onData);
    };
  }, [
    connectionState,
    microphone,
    connection,
    startMicrophone,
    sendMessage,
    status,
    stop,
    player,
    cartesiaTTS,
  ]);

  // Stream text chunks to TTS immediately in voice agent mode
  const lastProcessedTextLengthRef = useRef(0);

  useEffect(() => {
    if (!voiceAgentEnabled || !ttsEnabled) {
      return;
    }

    // Find the last assistant message
    const lastMessage = messages.at(-1);
    if (!lastMessage || lastMessage.role !== "assistant") {
      // Reset when no assistant message
      lastProcessedTextLengthRef.current = 0;
      return;
    }

    // Get current text content
    const textParts = lastMessage.parts?.filter((p) => p.type === "text");
    if (!textParts || textParts.length === 0) {
      return;
    }

    const fullText = textParts.map((p) => p.text).join(" ");
    const currentLength = fullText.length;

    // Check if this is a new message
    if (lastAutoPlayedMessageIdRef.current !== lastMessage.id) {
      if (DEBUG) {
        console.log(
          "Voice Agent: New message detected, starting TTS streaming"
        );
      }
      lastAutoPlayedMessageIdRef.current = lastMessage.id;
      lastProcessedTextLengthRef.current = 0;
    }

    // Check if we have new text
    if (currentLength > lastProcessedTextLengthRef.current) {
      const newText = fullText.substring(lastProcessedTextLengthRef.current);
      lastProcessedTextLengthRef.current = currentLength;

      if (DEBUG) {
        console.log("Voice Agent: New text chunk:", newText);
      }

      // Stream text chunk directly to Cartesia
      const streamChunk = async () => {
        if (newText.trim().length === 0) {
          return;
        }

        setVoiceAgentState("speaking");

        try {
          // Stream is continuing if status is "streaming"
          const shouldContinue = status === "streaming";

          if (DEBUG) {
            console.log(
              `Voice Agent: Streaming chunk (continue=${shouldContinue}):`,
              newText
            );
          }

          // For final chunk, provide callback to reset state
          const onComplete = shouldContinue
            ? undefined
            : () => {
                if (DEBUG) {
                  console.log("Voice Agent: Playback complete");
                }
                setVoiceAgentState("listening");
                cartesiaTTS.markComplete();
              };

          await cartesiaTTS.synthesizeAndPlay(
            newText,
            shouldContinue,
            onComplete
          );
        } catch (error) {
          console.error("Voice Agent: TTS streaming error:", error);
          setVoiceAgentState("listening");
        }
      };

      streamChunk();
    }
  }, [messages, status, voiceAgentEnabled, ttsEnabled, cartesiaTTS]);

  const { data: votes } = useSWR<Vote[]>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher
  );

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Note: Voice agent can work alongside artifact panel since artifact has its own layout

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <>
      <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
        <ChatHeader
          chatId={id}
          isReadonly={isReadonly}
          selectedVisibilityType={initialVisibilityType}
        />

        <Messages
          chatId={id}
          isArtifactVisible={isArtifactVisible}
          isReadonly={isReadonly}
          messages={messages}
          player={isMounted ? player : undefined}
          regenerate={regenerate}
          selectedModelId={initialChatModel}
          setMessages={setMessages}
          status={status}
          ttsEnabled={isMounted ? ttsEnabled : false}
          votes={votes}
        />

        {/* Composer or Voice Agent - same container, mutually exclusive */}
        <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
          {!isReadonly && !voiceAgentActive && (
            <MultimodalInput
              attachments={attachments}
              chatId={id}
              input={input}
              messages={messages}
              onModelChange={setCurrentModelId}
              selectedModelId={currentModelId}
              selectedVisibilityType={visibilityType}
              sendMessage={sendMessage}
              setAttachments={setAttachments}
              setInput={setInput}
              setMessages={setMessages}
              status={status}
              stop={stop}
              usage={usage}
            />
          )}

          {/* Voice Agent replaces composer in same container */}
          {isMounted && voiceAgentActive && (
            <VoiceAgentOverlay
              currentTranscript={
                partialTranscript
                  ? `${accumulatedTranscript} ${partialTranscript}`
                  : accumulatedTranscript
              }
              isActive={voiceAgentActive}
              isMuted={isMicMuted}
              micStream={mediaStream}
              onDeactivate={() => {
                if (DEBUG) {
                  console.log("Voice Agent: Deactivating...");
                }
                // Stop any ongoing TTS
                cartesiaTTS.stop();
                // Stop microphone and disconnect from Deepgram
                if (DEBUG) {
                  console.log("Voice Agent: Stopping microphone...");
                }
                stopMicrophone();
                if (DEBUG) {
                  console.log("Voice Agent: Disconnecting from Deepgram...");
                }
                disconnectFromDeepgram();
                // Reset voice agent
                setVoiceAgentActive(false);
                setVoiceAgentState("idle");
                setVoiceAgentEnabled(false); // Turn off in settings too
                setPartialTranscript("");
                setAccumulatedTranscript("");
                // Reset TTS streaming refs
                lastAutoPlayedMessageIdRef.current = null;
                lastProcessedTextLengthRef.current = 0;
                // Reset setup refs so voice agent can be re-enabled
                hasMicSetupRef.current = false;
                hasConnectedRef.current = false;
                lastSubmittedRef.current = "";
                lastSubmittedTimestampRef.current = 0;
                eotDetectionInProgressRef.current = false;
              }}
              onStateChange={setVoiceAgentState}
              onToggleMute={() => setIsMicMuted(!isMicMuted)}
              player={player}
              state={voiceAgentState}
            />
          )}
        </div>
      </div>

      <Artifact
        attachments={attachments}
        chatId={id}
        input={input}
        isReadonly={isReadonly}
        messages={messages}
        regenerate={regenerate}
        selectedModelId={currentModelId}
        selectedVisibilityType={visibilityType}
        sendMessage={sendMessage}
        setAttachments={setAttachments}
        setInput={setInput}
        setMessages={setMessages}
        status={status}
        stop={stop}
        voiceAgentActive={isMounted && voiceAgentActive}
        voiceAgentOverlay={
          isMounted && voiceAgentActive ? (
            <VoiceAgentOverlay
              currentTranscript={
                partialTranscript
                  ? `${accumulatedTranscript} ${partialTranscript}`
                  : accumulatedTranscript
              }
              isActive={voiceAgentActive}
              isMuted={isMicMuted}
              micStream={mediaStream}
              onDeactivate={() => {
                if (DEBUG) {
                  console.log("Voice Agent: Deactivating...");
                }
                // Stop any ongoing TTS
                cartesiaTTS.stop();
                // Stop microphone and disconnect from Deepgram
                if (DEBUG) {
                  console.log("Voice Agent: Stopping microphone...");
                }
                stopMicrophone();
                if (DEBUG) {
                  console.log("Voice Agent: Disconnecting from Deepgram...");
                }
                disconnectFromDeepgram();
                // Reset voice agent
                setVoiceAgentActive(false);
                setVoiceAgentState("idle");
                setVoiceAgentEnabled(false); // Turn off in settings too
                setPartialTranscript("");
                setAccumulatedTranscript("");
                // Reset TTS streaming refs
                lastAutoPlayedMessageIdRef.current = null;
                lastProcessedTextLengthRef.current = 0;
                // Reset setup refs so voice agent can be re-enabled
                hasMicSetupRef.current = false;
                hasConnectedRef.current = false;
                lastSubmittedRef.current = "";
                lastSubmittedTimestampRef.current = 0;
                eotDetectionInProgressRef.current = false;
              }}
              onStateChange={setVoiceAgentState}
              onToggleMute={() => setIsMicMuted(!isMicMuted)}
              player={player}
              state={voiceAgentState}
            />
          ) : undefined
        }
        votes={votes}
      />

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate AI Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              This application requires{" "}
              {process.env.NODE_ENV === "production" ? "the owner" : "you"} to
              activate Vercel AI Gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.open(
                  "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card",
                  "_blank"
                );
                window.location.href = "/";
              }}
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
