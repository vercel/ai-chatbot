"use client";

import { memo, useMemo } from "react";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "./elements/suggestion";

export interface FollowUpChipsProps {
  chatId: string;
  messages: ChatMessage[];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  className?: string;
}

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-zãáâàéêíóôõúüç0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
}

function buildFollowUps(lastAssistantText: string | undefined): string[] {
  const base = [
    "Explique melhor",
    "Próximo passo",
    "Exemplos práticos",
    "Quais riscos?",
  ];
  if (!lastAssistantText) return base;
  const kws = extractKeywords(lastAssistantText);
  const contextual: string[] = [];
  if (kws.length) {
    contextual.push(`Detalhe sobre ${kws[0]}`);
  }
  if (kws[1]) contextual.push(`Vantagens de ${kws[1]}`);
  if (kws[2]) contextual.push(`Custos de ${kws[2]}`);
  return Array.from(new Set([...contextual, ...base])).slice(0, 6);
}

function PureFollowUpChips({ chatId, messages, sendMessage, className }: FollowUpChipsProps) {
  const lastAssistantText = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    const part = last?.parts?.find((p) => p.type === "text") as { type: "text"; text: string } | undefined;
    return part?.text?.slice(0, 400);
  }, [messages]);

  const followUps = useMemo(() => buildFollowUps(lastAssistantText), [lastAssistantText]);

  if (followUps.length === 0) return null;

  return (
    <div className={"flex flex-wrap gap-2 " + (className || "")}> 
      {followUps.map((label) => (
        <Suggestion
          key={label}
          suggestion={label}
          onClick={(text) => {
            try { window.history.replaceState({}, "", `/chat/${chatId}`); } catch {}
            sendMessage({ role: "user", parts: [{ type: "text", text }] });
          }}
          className="px-3 py-1.5 text-xs"
        >
          {label}
        </Suggestion>
      ))}
    </div>
  );
}

export const FollowUpChips = memo(PureFollowUpChips);

