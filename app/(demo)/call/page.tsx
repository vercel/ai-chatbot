"use client";

import { Mic, PhoneOff } from "lucide-react";
import { useRef, useState } from "react";
import { FullScreenOrb } from "@/components/avatar/FullScreenOrb";
import type { State } from "@/components/avatar/types";
import ContextDrawer from "@/components/ContextDrawer";
import { Button } from "@/components/ui/button";
import { useHeyGenAvatar } from "@/hooks/useHeyGenAvatar";
import { ABOUT_TEXT } from "@/lib/mockData";
import { cn } from "@/lib/utils";

type TranscriptMessage = {
  id: string;
  role: "user" | "glen";
  text: string;
};

export default function CallPage() {
  const [avatarState, setAvatarState] = useState<State>("idle");
  const [avatarText, setAvatarText] = useState<string>();
  const [callState, setCallState] = useState<"idle" | "active">("idle");
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);

  const intervalRef = useRef<number | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  const { videoRef, isConnected, startSession, stopSession } =
    useHeyGenAvatar();

  const scrollToBottom = () => {
    const el = transcriptRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  };

  const pushMessage = (msg: Omit<TranscriptMessage, "id">) => {
    setMessages((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), ...msg },
    ]);
    // Scroll on next frame after DOM update
    setTimeout(() => {
      scrollToBottom();
    }, 0);
  };

  const startDummyConversation = () => {
    const script: TranscriptMessage[] = [
      {
        id: "a",
        role: "glen",
        text: "Hi there — this is Glen. How can I help today?",
      },
      {
        id: "b",
        role: "user",
        text: "Could you prep me for my oncology meeting?",
      },
      {
        id: "c",
        role: "glen",
        text: "Absolutely. Three key priorities: patient outcomes, trial timelines, and budget impact.",
      },
      {
        id: "d",
        role: "user",
        text: "What's the single most important question to ask the team?",
      },
      {
        id: "e",
        role: "glen",
        text: "Ask them what would cause a delay in approval and how we preempt it.",
      },
    ];

    let idx = 0;
    setMessages([]);

    const first = script[0];
    if (first) {
      pushMessage({ role: first.role, text: first.text });
      idx = 1;
    }

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    intervalRef.current = window.setInterval(() => {
      if (idx >= script.length) {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      const next = script[idx];
      if (!next) {
        return;
      }

      pushMessage({ role: next.role, text: next.text });

      // Pseudo-state to make the orb feel alive
      setAvatarState((s) => (s === "speaking" ? "thinking" : "speaking"));
      setAvatarText(next.role === "glen" ? next.text : undefined);

      idx += 1;
    }, 1600);
  };

  const handleConnect = async () => {
    setAvatarState("thinking");
    await startSession();
    setAvatarState("listening");
    setCallState("active");
    startDummyConversation();
  };

  const handleHangUp = async () => {
    await stopSession();
    setAvatarState("idle");
    setAvatarText(undefined);
    setCallState("idle");

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 p-6 lg:flex-row">
      {/* Left: Glen / Orb */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 lg:gap-6">
        <div className="flex w-full items-center justify-between">
          <div className="flex-1" />
          <ContextDrawer about={ABOUT_TEXT} />
        </div>

        <FullScreenOrb
          isConnected={isConnected}
          preferPhoto={true}
          showAvatar={true}
          size={350}
          state={avatarState}
          text={avatarText}
          videoRef={videoRef}
        />

        <Button
          className={cn(
            callState === "idle"
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-red-600 text-white hover:bg-red-700"
          )}
          onClick={callState === "idle" ? handleConnect : handleHangUp}
          size="xl"
          type="button"
        >
          {callState === "idle" ? (
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
      </div>

      {/* Right: Transcript */}
      <div className="flex w-full flex-1 flex-col lg:max-w-xl">
        <h2 className="mb-3 font-semibold text-lg">Live Transcript</h2>
        <div
          aria-live="polite"
          className="h-[420px] overflow-auto rounded-xl border bg-card p-4 shadow-sm"
          ref={transcriptRef}
          role="log"
        >
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-sm">No messages yet.</p>
          ) : (
            <ul className="space-y-3">
              {messages.map((m) => (
                <li className="flex items-start gap-2" key={m.id}>
                  <div
                    className={cn(
                      "mt-1 size-2.5 shrink-0 rounded-full",
                      m.role === "glen"
                        ? "bg-primary"
                        : "bg-muted-foreground/50"
                    )}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="text-muted-foreground text-xs">
                      {m.role === "glen" ? "Glen" : "You"}
                    </span>
                    <p className="text-sm leading-relaxed">{m.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
