"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MeetingTranscriber, type CaptureMode, type TranscriptSegment } from "@/services/assembly-ai/meeting-transcriber";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/toast";

function formatDuration(ms: number) {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function MeetingTranscriberClient() {
  const [mode, setMode] = useState<CaptureMode>("mic");
  const [status, setStatus] = useState<string>("Ready");
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [interim, setInterim] = useState("");
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);

  const transcriberRef = useRef<MeetingTranscriber | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [driveConnected, setDriveConnected] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");

  useEffect(() => {
    transcriberRef.current = new MeetingTranscriber();
    return () => {
      transcriberRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    // Check Drive integration status
    (async () => {
      try {
        const res = await fetch("/api/integrations/google/status");
        if (!res.ok) return setDriveConnected(false);
        const json = (await res.json()) as { connected?: boolean };
        setDriveConnected(!!json?.connected);
      } catch {
        setDriveConnected(false);
      }
    })();
  }, []);

  useEffect(() => {
    // Set a default title once on mount
    const now = new Date();
    setTitle(`Meeting Transcript ${now.toISOString()}`);
  }, []);

  useEffect(() => {
    const id = isRecording
      ? window.setInterval(() => {
          if (startTimeRef.current) setDuration(Date.now() - startTimeRef.current);
        }, 250)
      : null;
    return () => {
      if (id) window.clearInterval(id);
    };
  }, [isRecording]);

  const onTranscript = useCallback((s: TranscriptSegment) => {
    if (s.isFinal) {
      setSegments((prev) => [...prev, s]);
      setInterim("");
    } else {
      setInterim(s.text);
    }
  }, []);

  const onStart = useCallback(async () => {
    setSegments([]);
    setInterim("");
    setDuration(0);
    startTimeRef.current = Date.now();
    const t = transcriberRef.current!;
    t.setCaptureMode(mode);
    try {
      await t.start(onTranscript, setStatus);
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setStatus("Failed to start");
      setIsRecording(false);
    }
  }, [mode, onTranscript]);

  const onStop = useCallback(async () => {
    await transcriberRef.current?.stop();
    setIsRecording(false);
    startTimeRef.current = null;
  }, []);

  const fullText = useMemo(() => {
    const lines = segments.map((s) => s.text);
    if (interim.trim()) lines.push(interim.trim());
    return lines.join(" ");
  }, [segments, interim]);

  const onDownload = useCallback(() => {
    const now = new Date();
    const title = `Meeting Transcript ${now.toISOString()}`;
    const md = [
      `# ${title}`,
      "",
      `- Capture: ${mode === "both" ? "Microphone + Tab Audio" : "Microphone"}`,
      `- Duration: ${formatDuration(duration)}`,
      `- Generated: ${now.toString()}`,
      "",
      fullText || "(No transcript captured)",
      "",
    ].join("\n");

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [duration, fullText, mode]);

  const onSaveToDrive = useCallback(async () => {
    if (!fullText.trim()) {
      toast({ type: "error", description: "No transcript to save" });
      return;
    }
    if (!driveConnected) {
      toast({ type: "error", description: "Connect Google Drive in Settings first" });
      return;
    }
    const trimmedTitle = title.trim() || `Meeting Transcript ${new Date().toISOString()}`;
    try {
      const res = await fetch("/api/meetings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedTitle, transcriptText: fullText, folderId: "warburg-demo/meetings" }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const msg = json?.error || json?.details || "Failed to save to Drive";
        toast({ type: "error", description: String(msg) });
        return;
      }
      const json = (await res.json()) as { driveFileId: string };
      toast({ type: "success", description: `Saved to Drive` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ type: "error", description: msg });
    }
  }, [fullText, driveConnected, title]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 md:px-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meeting</h1>
        <p className="text-muted-foreground">Record and transcribe your meetings in real-time</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Meeting Transcription</CardTitle>
          <Badge variant={isRecording ? "default" : "secondary"}>{status}</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Capture:</span>
              <div className="inline-flex rounded-md border p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={mode === "mic" ? "default" : "ghost"}
                  onClick={() => setMode("mic")}
                  disabled={isRecording}
                >
                  Microphone
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={mode === "both" ? "default" : "ghost"}
                  onClick={() => setMode("both")}
                  disabled={isRecording}
                >
                  Mic + Tab Audio
                </Button>
              </div>

              <div className="ml-auto flex items-center gap-3">
                {isRecording ? (
                  <Button variant="destructive" onClick={onStop}>
                    Stop Recording
                  </Button>
                ) : (
                  <Button onClick={onStart}>Start Recording</Button>
                )}
                <div className="text-sm tabular-nums text-muted-foreground">
                  Duration: {formatDuration(duration)}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: When prompted, select your browser meeting/media tab and check “Share tab audio”.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-muted/30 p-6 text-sm leading-7">
            {segments.length === 0 && !interim ? (
              <div className="text-center text-muted-foreground">
                Start speaking to see the transcript appear here…
              </div>
            ) : (
              <div className="space-y-2">
                {segments.map((s, idx) => (
                  <p key={idx}>{s.text}</p>
                ))}
                {interim && (
                  <p className="text-muted-foreground">{interim}</p>
                )}
              </div>
            )}
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
            <div className="flex w-full items-center gap-2 md:w-auto md:min-w-[320px]">
              <Input
                placeholder="Document title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isRecording}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onDownload} disabled={isRecording}>
                Download .md
              </Button>
              <Button
                variant="ghost"
                onClick={onSaveToDrive}
                disabled={isRecording || !driveConnected}
                title={driveConnected ? "" : "Connect Google Drive in Settings to enable"}
              >
                Save to Google Drive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
