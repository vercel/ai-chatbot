"use client";

import { useCallback, useState } from "react";
import { startBBSSession, runStagehand } from "@/app/stagehand/main";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Status = "idle" | "starting" | "ready" | "running" | "done" | "error";

export function BrowserViewport() {
  const [status, setStatus] = useState<Status>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [debugUrl, setDebugUrl] = useState<string | null>(null);
  const [instruction, setInstruction] = useState<string>("");
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartSession = useCallback(async () => {
    try {
      setStatus("starting");
      setErrorMessage(null);

      const { sessionId, debugUrl } = await startBBSSession();
      setSessionId(sessionId);
      setDebugUrl(debugUrl);

      setStatus("ready");
    } catch (err: any) {
      console.error("Failed to start Browserbase session", err);
      setErrorMessage("Failed to start browser session.");
      setStatus("error");
    }
  }, []);

  const handleRun = useCallback(async () => {
    if (!sessionId) return;

    try {
      setStatus("running");
      setErrorMessage(null);
      setLastResult(null);

      const result = await runStagehand(sessionId, instruction || "Explore this page");

      if (result && typeof result.title === "string") {
        setLastResult(`Stagehand result: "${result.title}"`);
      } else {
        setLastResult("Stagehand finished without a structured result.");
      }

      setStatus("done");
    } catch (err: any) {
      console.error("Stagehand run failed", err);
      setErrorMessage("Stagehand run failed.");
      setStatus("error");
    }
  }, [sessionId, instruction]);

  const disabled = status === "starting" || status === "running";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold">AI Browser</h2>
          <p className="text-[11px] text-muted-foreground">
            Powered by Stagehand + Browserbase
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          Status:{" "}
          {status === "idle"
            ? "Idle"
            : status === "starting"
            ? "Starting…"
            : status === "ready"
            ? "Ready"
            : status === "running"
            ? "Running…"
            : status === "done"
            ? "Done"
            : "Error"}
        </span>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2 border-b px-3 py-2">
        {!sessionId && (
          <Button
            size="sm"
            className="w-fit"
            onClick={handleStartSession}
            disabled={disabled}
          >
            {status === "starting" ? "Starting…" : "Start Browser Session"}
          </Button>
        )}

        {sessionId && (
          <>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Describe what you want the browser to do…"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                disabled={disabled}
              />
              <Button size="sm" onClick={handleRun} disabled={disabled || !instruction.trim()}>
                {status === "running" ? "Running…" : "Run"}
              </Button>
            </div>
            {lastResult && (
              <p className="text-[11px] text-muted-foreground">
                {lastResult}
              </p>
            )}
            {errorMessage && (
              <p className="text-[11px] text-destructive">{errorMessage}</p>
            )}
          </>
        )}
      </div>

      {/* Live browser iframe */}
      <div className="flex-1 bg-muted/30">
        {sessionId && debugUrl ? (
          <iframe
            src={debugUrl}
            className="h-full w-full border-0"
            title="Browserbase Live Session"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
            Start a session to see the live browser here.
          </div>
        )}
      </div>
    </div>
  );
}
