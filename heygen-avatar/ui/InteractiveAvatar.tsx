import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  VoiceChatTransport,
  VoiceEmotion,
  StartAvatarRequest,
  STTProvider,
  ElevenLabsModel,
  TaskType,
  TaskMode,
} from "@heygen/streaming-avatar";
import { useEffect, useRef, useState } from "react";
import { useMemoizedFn, useUnmount } from "ahooks";
import { Button } from "@/components/ui/button";
import { AvatarVideo } from "../AvatarSession/AvatarVideo";
import { useStreamingAvatarSession } from "../avatar-stream-hooks/useStreamingAvatarSession";
import { useVoiceChat } from "../avatar-stream-hooks/useVoiceChat";
import {
  StreamingAvatarProvider,
  StreamingAvatarSessionState,
} from "../avatar-stream-hooks";
import { LoadingIcon } from "../ui/Icons";
import ErrorDialog from "@/components/ui/error-dialog";

const DEFAULT_CONFIG: StartAvatarRequest = {
  quality: AvatarQuality.High,
  avatarName: process.env.NEXT_PUBLIC_AVATAR_ID || "Bryan_FitnessCoach_public",
  knowledgeId: process.env.NEXT_PUBLIC_KNOWLEDGE_ID || "",
  voice: {
    rate: 0.96,
    emotion: VoiceEmotion.SERIOUS,
    model: ElevenLabsModel.eleven_flash_v2_5,
    voiceId: process.env.NEXT_PUBLIC_AVATAR_VOICE_ID || undefined,
    elevenlabsSettings: {
      stability: 0.99,
      similarity_boost: 0.88,
      style: 0.0,
      use_speaker_boost: true,
    },
  },
  language: "en",
  // Disable voice chat to avoid LiveKit DataChannel errors
  // voiceChatTransport: VoiceChatTransport.LIVEKIT,
  disableIdleTimeout: true,
  // useSilencePrompt: false,
  // sttSettings: {
  //   provider: STTProvider.DEEPGRAM,
  //   confidence: 0.9,
  // },
};

interface InteractiveAvatarProps {
  suggestedQuestion: string | null;
  setSelectedSuggestedQuestion: (question: string | null) => void;
  onSessionStart?: () => void;
}

function InteractiveAvatar({
  suggestedQuestion,
  setSelectedSuggestedQuestion,
  onSessionStart,
}: InteractiveAvatarProps) {
  const { initAvatar, startAvatar, stopAvatar, sessionState, stream } =
    useStreamingAvatarSession();
  const { startVoiceChat } = useVoiceChat();
  const [avatar, setAvatar] = useState<StreamingAvatar | null>(null);
  const [isStartingAvatar, setIsStartingAvatar] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const mediaStream = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (suggestedQuestion) {
      if (!avatar && !isStartingAvatar) {
        startSessionV2(true);
      } else if (avatar) {
        askQuestion(suggestedQuestion, avatar);
      }
    }
  }, [suggestedQuestion, avatar]);

  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-heygen-token", {
        method: "POST",
      });

      return await response.text();
    } catch (error) {
      console.error("Error fetching access token:", error);
      throw error;
    }
  }

  const StartAvatarButton = () => {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-card gap-8">
        <div className="relative w-48 h-48 rounded-full overflow-hidden">
          <img
            src="/images/glen-avatar.png"
            alt="Glen Tullman"
            className="w-full h-full object-cover"
          />
        </div>
        <Button
          variant="default"
          size="lg"
          className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-6 text-lg rounded-full"
          onClick={() => {
            setSelectedSuggestedQuestion(null);
            startSessionV2(true);
          }}
        >
          Start Video Chat with Avatar
        </Button>
      </div>
    );
  };

  const startSessionV2 = useMemoizedFn(async (isVoiceChat: boolean) => {
    try {
      setIsStartingAvatar(true);
      const newToken = await fetchAccessToken();
      const avatar = initAvatar(newToken);

      avatar.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
        console.log("Avatar started talking", e);
      });
      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
        console.log("Avatar stopped talking", e);
      });
      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log("Stream disconnected");
      });
      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        console.log(">>>>> Stream ready:", event.detail);
      });
      avatar.on(StreamingEvents.USER_START, (event: any) => {
        console.log(">>>>> User started talking:", event);
      });
      avatar.on(StreamingEvents.USER_STOP, (event) => {
        console.log(">>>>> User stopped talking:", event);
      });
      avatar.on(StreamingEvents.USER_END_MESSAGE, (event) => {
        console.log(">>>>> User end message:", event);
      });
      avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (event) => {
        console.log(">>>>> User talking message:", event);
      });
      avatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (event) => {
        console.log(">>>>> Avatar talking message:", event);
      });

      avatar.on(StreamingEvents.AVATAR_END_MESSAGE, (event) => {
        console.log(">>>>> Avatar end message:", event);
        setSelectedSuggestedQuestion(null);
      });

      await startAvatar(DEFAULT_CONFIG);

      // Notify parent that session has started
      if (onSessionStart) {
        onSessionStart();
      }

      if (suggestedQuestion) {
        setTimeout(async () => {
          await askQuestion(suggestedQuestion, avatar);
        }, 4000);
      }

      // Disable voice chat to avoid LiveKit errors
      // if (isVoiceChat) {
      //   await startVoiceChat();
      // }

      setAvatar(avatar);
      setIsStartingAvatar(false);
    } catch (error) {
      console.error("Error starting avatar session:", error);
      setErrorModal(
        "An unexpected error occurred with the video session. Please refresh the page and try again."
      );
    }
  });

  const askQuestion = async (question: string, avatar: StreamingAvatar) => {
    await avatar?.speak({
      text: question,
      taskType: TaskType.TALK,
      taskMode: TaskMode.ASYNC,
    });
  };

  const handleStopAvatar = async () => {
    await stopAvatar();
    setAvatar(null);
  };

  useUnmount(() => {
    stopAvatar();
  });

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
      };
    }
  }, [mediaStream, stream]);

  const avatarActive = sessionState !== StreamingAvatarSessionState.INACTIVE;
  const avatarInactive = sessionState === StreamingAvatarSessionState.INACTIVE;
  const avatarLoading = sessionState === StreamingAvatarSessionState.CONNECTING;

  return (
    <div className="absolute inset-0 flex items-center justify-center h-full">
      <div className="absolute inset-0 bottom-[50px] flex flex-col items-center justify-center rounded-xl">
        {avatarActive && (
          <AvatarVideo ref={mediaStream} handleStop={handleStopAvatar} />
        )}
        {avatarInactive && <StartAvatarButton />}
        {avatarLoading && <LoadingIcon className="absolute center" />}
      </div>

      <ErrorDialog
        open={!!errorModal}
        onOpenChange={(o) => {
          if (!o) setErrorModal(null);
        }}
        description={errorModal}
        refreshLabel="Refresh"
      />
    </div>
  );
}

interface InteractiveAvatarWrapperProps {
  setSelectedSuggestedQuestion: (question: string | null) => void;
  suggestedQuestion: string | null;
  onSessionStart?: () => void;
}

export default function InteractiveAvatarWrapper({
  suggestedQuestion,
  setSelectedSuggestedQuestion,
  onSessionStart,
}: InteractiveAvatarWrapperProps) {
  return (
    <StreamingAvatarProvider>
      <InteractiveAvatar
        suggestedQuestion={suggestedQuestion}
        setSelectedSuggestedQuestion={setSelectedSuggestedQuestion}
        onSessionStart={onSessionStart}
      />
    </StreamingAvatarProvider>
  );
}
