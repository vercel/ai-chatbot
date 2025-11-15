"use client";

import { useEffect, useState } from "react";
import { useDataStream } from "./data-stream-provider";

type Status = "idle" | "running" | "done";

type BrowserSessionInitData = {
  chatId: string;
  sessionId: string;
  debugUrl: string;
  sessionUrl?: string;
  instruction: string;
};

type BrowserSessionFinalData = {
  chatId: string;
  sessionId: string;
  sessionUrl: string;
};

type BrowserSessionInitEvent = {
  type: "data-browser-session";
  data: BrowserSessionInitData;
};

type BrowserSessionFinalEvent = {
  type: "data-browser-session-final";
  data: BrowserSessionFinalData;
};

export function BrowserViewport() {
  const { dataStream } = useDataStream();
  const [status, setStatus] = useState<Status>("idle");
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [lastInstruction, setLastInstruction] = useState<string | null>(null);

  useEffect(() => {
    if (!dataStream) return;

    // live DevTools URL
    const initEvents = (dataStream
      .filter(
        (part: any) =>
          part &&
          part.type === "data-browser-session" &&
          part.data &&
          typeof part.data.debugUrl === "string",
      ) as unknown) as BrowserSessionInitEvent[];

    const lastInit = initEvents.at(-1);
    if (lastInit && lastInit.data) {
      const { debugUrl, instruction } = lastInit.data;

      if (debugUrl) {
        setLiveUrl(debugUrl);
        setStatus("running");
      }

      if (instruction) {
        setLastInstruction(instruction);
      }
    }

    // switch to static viewer URL
    const finalEvents = (dataStream
      .filter(
        (part: any) =>
          part &&
          part.type === "data-browser-session-final" &&
          part.data &&
          typeof part.data.sessionUrl === "string",
      ) as unknown) as BrowserSessionFinalEvent[];

    const lastFinal = finalEvents.at(-1);
    if (lastFinal && lastFinal.data) {
      const { sessionUrl } = lastFinal.data;
      if (sessionUrl) {
        setFinalUrl(sessionUrl);
        setStatus("done");
      }
    }
  }, [dataStream]);

  const iframeSrc = finalUrl ?? liveUrl;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold">AI Browser</h2>
          <p className="text-[11px] text-muted-foreground">
            Linked to the AI Browser chat
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          Status:{" "}
          {status === "idle"
            ? "Idle"
            : status === "running"
            ? "Running…"
            : "Done"}
        </span>
      </div>

      {/* Context about what it’s doing */}
      {lastInstruction && (
        <div className="border-b px-3 py-2">
          <p className="text-[11px] text-muted-foreground">
            Latest instruction:{" "}
            <span className="font-medium text-foreground">
              {lastInstruction}
            </span>
          </p>
        </div>
      )}

      {/* Live / final browser iframe */}
      <div className="flex-1 bg-muted/30">
        {iframeSrc ? (
          <iframe
            src={iframeSrc}
            className="h-full w-full border-0"
            title="Browserbase Session"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
            Send a message in the AI Browser chat to start a browser session and
            watch it work here.
          </div>
        )}
      </div>
    </div>
  );
}
