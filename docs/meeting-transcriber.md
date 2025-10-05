# Meeting Notes Transcriber — Plan & Implementation Guide

This document defines the plan and design for the Meeting Notes Transcriber and explains how it will be implemented in this repo. It uses AssemblyAI Realtime for low‑latency speech‑to‑text and a client‑side Web Audio pipeline to capture and mix inputs.

---

## Project Plan (Phased)

Milestones are incremental; no code should ship beyond the current milestone scope.

- M1 — Core Realtime Transcription (ship first)
  - Capture modes: Microphone, Mic + Tab Audio (user checks “Share tab audio”).
  - WebSocket streaming to AssemblyAI Realtime with interim and finalized segments.
  - UI states: Ready, Connected – Listening, Stopped; duration timer; error toasts.
  - Export: Download transcript locally as a `.md` file (client‑side only).
  - Security: Short‑lived token route; API key never sent to browser.

- M2 — Polish and Reliability
  - Robust reconnection/backoff; graceful stop; cleanup of tracks/context.
  - Better text formatting: speaker turns, timestamps, headings.
  - Accessibility: keyboard shortcuts, focus management, live region updates.
  - Rate limiting for token route; structured logs + basic telemetry.

- M3 — Google Drive Export (feature‑gated)
  - Add “Save to Google Drive” button and folder picker dialog.
  - Export only enabled when Google Drive is integrated (OAuth connected); otherwise button disabled with tooltip.
  - Server route to upload `.md` file to selected folder; persistent tokens stored using existing `GoogleCredential` table.

Out of scope for initial milestones: diarization beyond what AssemblyAI provides, speaker labeling via external services, and long‑term transcript storage in Postgres.

---

## Acceptance Criteria

- Users can select capture mode: Microphone or Mic + Tab Audio.
- Clicking Start connects to AssemblyAI Realtime, streaming audio and showing interim text; Stop ends session and cleans up resources.
- Live transcript area updates continuously; finalized segments are clearly distinguished from interim text.
- Duration is visible while recording; status chip reflects Ready/Connected/Stopped.
- Export button downloads a `.md` file with the full transcript and session metadata (title, start/end time, duration).
- “Save to Google Drive” button is present but disabled until Google Drive integration is enabled (M3), with an explanatory tooltip.
- API key is never exposed to the client; a short‑lived token is used.

---

## UX Notes (aligned to provided mockups)

- Page title “Meeting” with subtitle “Record and transcribe your meetings in real‑time”.
- Card 1: “Meeting Transcription”
  - Capture toggle: `Microphone` | `Mic + Tab Audio`
  - Primary action: `Start Recording` / `Stop Recording`
  - Status chip: Ready / Connected – Listening…
  - Duration on the right.
  - Tip text: “When prompted, select your browser meeting/media tab and check ‘Share tab audio’.”
- Card 2: “Live Transcript”
  - Placeholder when empty: “Start speaking to see the transcript appear here…”
  - Streamed interim lines and finalized segments appended.
  - Footer actions (right‑aligned): `Download .md` (enabled), `Save to Google Drive` (disabled until M3 integration).

---

## Overview
- Client captures microphone and optional “tab audio” (e.g., Meet/Zoom tab) and mixes them in Web Audio without feedback.
- Audio is downsampled to 16 kHz PCM16 and streamed over WebSocket to AssemblyAI Realtime.
- Incoming messages update the UI with interim and finalized transcript segments.
- A server route generates a short‑lived AssemblyAI token; the API key never reaches the browser.
- Export options:
  - Now (M1): Download transcript as `.md` file from the browser.
  - Later (M3): Save to Google Drive via server route; button disabled if Drive is not integrated.

## Prerequisites
- Next.js (App Router)
- AssemblyAI account and API key
- HTTPS in production (browser media APIs)
- Chrome recommended for tab audio (“Share tab audio”)

---

## 1) Environment Variable
Create `.env.local` with your AssemblyAI key:

```bash
ASSEMBLYAI_API_KEY=your_assemblyai_key_here
```

Feature gate for Google Drive export (M3):

- The “Save to Google Drive” button is disabled unless Google OAuth is integrated and the user has connected their account (tokens present in `GoogleCredential`). No additional envs are required for M1.

---

## 2) Server Route: Realtime Token Generator
Create a server route that exchanges your server‑side API key for a short‑lived token consumable by the browser.

Path: `app/api/assembly-ai/generate-realtime-token/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY

export async function POST(_request: NextRequest) {
  try {
    if (!ASSEMBLYAI_API_KEY) {
      return NextResponse.json(
        { error: 'AssemblyAI API key not configured' },
        { status: 500 }
      )
    }

    const params = new URLSearchParams({ expires_in_seconds: '600' })

    const response = await fetch(
      `https://streaming.assemblyai.com/v3/token?${params.toString()}`,
      {
        method: 'GET',
        headers: { Authorization: ASSEMBLYAI_API_KEY },
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      return NextResponse.json(
        { error: 'Failed to generate token', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    if (!data?.token) {
      return NextResponse.json(
        { error: 'Invalid response from AssemblyAI' },
        { status: 502 }
      )
    }

    return NextResponse.json({ token: data.token })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Error generating realtime token', details: message },
      { status: 500 }
    )
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}
```

Why: The browser authenticates to AssemblyAI with a short‑lived token, not your API key.

---

## 3) Client Service: MeetingTranscriber
Client‑only class that sets up audio capture, downsampling, and the AssemblyAI WebSocket.

Path: `services/assembly-ai/meeting-transcriber.ts`

Key responsibilities:
- Capture mode: `'mic' | 'tab' | 'both'`
- Mic: `getUserMedia()`; Tab audio: `getDisplayMedia({ video: true, audio: ... })` (user must check “Share tab audio”).
- Web Audio graph: mix inputs -> `ScriptProcessorNode` -> downsample -> PCM16 frames -> WebSocket send.
- WebSocket lifecycle: connect, parse messages, retry on drop, terminate on stop.

Constructor and interfaces:

```ts
export interface TranscriptSegment {
  text: string
  timestamp: string
  confidence?: number
  isFinal?: boolean
}

export class MeetingTranscriber {
  private SAMPLE_RATE = 16000
  private captureMode: 'mic' | 'tab' | 'both' = 'both'
  // micStream, tabStream, audioContext, processor, socket, etc.

  setCaptureMode(mode: 'mic' | 'tab' | 'both') {
    this.captureMode = mode
  }
}
```

Audio capture and Web Audio pipeline:

```ts
private async setupAudioCapture(): Promise<void> {
  // Acquire mic and/or tab audio
  if (this.captureMode !== 'tab') this.micStream = await navigator.mediaDevices.getUserMedia({
    audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  })

  if (this.captureMode !== 'mic') {
    // Prompt user: select tab and enable “Share tab audio”
    const s = await (navigator.mediaDevices as any).getDisplayMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      video: true,
    })
    s.getVideoTracks().forEach(t => t.stop()) // we only need audio
    this.tabStream = s.getAudioTracks().length ? s : null
  }

  this.audioContext = new AudioContext({ sampleRate: 16000 })
  this.processor = this.audioContext.createScriptProcessor(4096, 1, 1)

  // Mix sources into the processor
  const gain = this.audioContext.createGain()
  gain.gain.value = 0 // mute to avoid feedback

  if (this.micStream) this.audioContext.createMediaStreamSource(this.micStream).connect(this.processor)
  if (this.tabStream) this.audioContext.createMediaStreamSource(this.tabStream).connect(this.processor)

  this.processor.connect(gain)
  gain.connect(this.audioContext.destination)
}
```

Downsampling and sending frames:

```ts
this.processor.onaudioprocess = (event) => {
  if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return
  const input = event.inputBuffer.getChannelData(0)
  const inRate = this.audioContext!.sampleRate // may differ across devices
  const downsampled = this.downsampleTo16k(input, inRate)
  this.enqueueAndSendPcm16(downsampled) // frames of ~800 samples
}

private downsampleTo16k(input: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === 16000) return input
  const ratio = inputSampleRate / 16000
  const newLength = Math.round(input.length / ratio)
  const result = new Float32Array(newLength)
  let offsetResult = 0, offsetInput = 0
  while (offsetResult < result.length) {
    const nextOffsetInput = Math.min(Math.round((offsetResult + 1) * ratio), input.length)
    let sum = 0, count = 0
    for (let i = offsetInput; i < nextOffsetInput; i++) { sum += input[i]; count++ }
    result[offsetResult++] = count > 0 ? sum / count : 0
    offsetInput = nextOffsetInput
  }
  return result
}

private enqueueAndSendPcm16(chunk: Float32Array) {
  const frameSize = 800
  // (buffering omitted) convert float -> int16 and send
}
```

WebSocket connection and message handling:

```ts
private setupWebSocketConnection(): Promise<void> {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      token: this.authToken,
      sample_rate: '16000',
      encoding: 'pcm_s16le',
      format_turns: 'true',
    })
    this.socket = new WebSocket(`wss://streaming.assemblyai.com/v3/ws?${params}`)

    this.socket.onopen = () => { this.onStatusChange?.('Connected - Listening...'); resolve() }

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'Turn') {
        const text = data.transcript || ''
        if (!text) return
        const end = !!data.end_of_turn
        this.onTranscript?.({
          text,
          timestamp: new Date().toLocaleTimeString(),
          confidence: data.end_of_turn_confidence ?? (end ? 0.9 : 0.8),
          isFinal: end && !!data.turn_is_formatted,
        })
      }
    }

    this.socket.onclose = () => {/* retry/backoff omitted */}
  })
}
```

Start/stop lifecycle:

```ts
async startRecording(onTranscript: (s: TranscriptSegment) => void, onStatusChange?: (s: string) => void) {
  this.onTranscript = onTranscript
  this.onStatusChange = onStatusChange || null
  this.onStatusChange?.('Authenticating...')
  this.authToken = await this.fetchAuthToken() // POST /api/assembly-ai/generate-realtime-token
  this.onStatusChange?.('Setting up microphone...')
  await this.setupAudioCapture()
  this.onStatusChange?.('Connecting to transcription service...')
  await this.setupWebSocketConnection()
}

async stopRecording() {
  this.onStatusChange?.('Stopping...')
  try { this.socket?.send(JSON.stringify({ type: 'Terminate' })) } catch {}
  this.socket?.close()
  this.processor?.disconnect()
  await this.audioContext?.close()
  ;[this.micStream, this.tabStream].forEach(s => s?.getTracks().forEach(t => t.stop()))
  this.onStatusChange?.('Stopped')
}
```

---

## 4) Export & Persistence

M1: Local download only
- Provide a `Download .md` button that serializes the full transcript (including start/end time, duration, capture mode) into Markdown and triggers a client‑side download via a Blob URL.
- No server or database write required.

M3: Google Drive export (feature‑gated)
- Show a `Save to Google Drive` button next to the download button.
- Disabled state until the user has connected Google (tokens exist in `GoogleCredential`).
- On click (enabled): open a folder picker, then POST to a server route that uploads the `.md` file to the selected Drive folder using the user’s OAuth tokens.

---

## 5) Security, Limits, and Telemetry

- Protect token route with authentication middleware; rate‑limit by user to prevent abuse.
- Never expose `ASSEMBLYAI_API_KEY` to the client; only return short‑lived tokens.
- Log key client and server events: start, stop, connect, reconnects, and failures.

---

## 6) Testing Strategy

- Routes (Playwright `routes` project):
  - Token route returns 200 with a token when env present; 500 otherwise.
  - Rate‑limit behavior validated with repeated calls.
- E2E (Playwright `e2e` project):
  - Page renders controls and disabled/enabled states per mockups.
  - Start/Stop toggles status chip and shows duration incrementing.
  - Interim transcript placeholder replaced once messages arrive (mock WebSocket in tests).
  - Download `.md` produces a file with expected front‑matter/metadata and body.
  - Google Drive button is disabled by default (until M3 integration).

---

## 7) Done Checklist per Milestone

M1 (ship):
- [ ] Start/Stop recording with mic and optional tab audio.
- [ ] Live interim + final transcript rendering.
- [ ] Status chip and duration timer.
- [ ] Download transcript as `.md`.
- [ ] Token route behind auth, rate‑limited.

M2:
- [ ] Reconnect/backoff; robust cleanup; improved formatting.
- [ ] Accessibility polish; telemetry; better error messaging.

M3:
- [ ] Google OAuth integration + folder picker.
- [ ] Drive upload route; enable button when connected.

---

## 4) UI Component: Live Transcription
Renders controls, status, live transcript (final + interim), and a duration timer. Also exposes a Save panel when not recording.

Path: `components/MeetingTranscription.tsx`

Initialization and cleanup:

```tsx
'use client'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { MeetingTranscriber, type TranscriptSegment } from '@/services/assembly-ai/meeting-transcriber'

export default function MeetingTranscription() {
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState('Ready')
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([])
  const [interim, setInterim] = useState('')
  const [captureMode, setCaptureMode] = useState<'mic' | 'both'>('both')
  const transcriberRef = useRef<MeetingTranscriber | null>(null)

  useEffect(() => {
    transcriberRef.current = new MeetingTranscriber()
    return () => { transcriberRef.current?.stopRecording().catch(() => {}) }
  }, [])
  // ...
}
```

Start/stop and transcript handling:

```tsx
const handleTranscriptUpdate = useCallback((seg: TranscriptSegment) => {
  if (seg.isFinal) { setTranscript(prev => [...prev, seg]); setInterim('') }
  else { setInterim(seg.text) }
}, [])

const start = async () => {
  const t = transcriberRef.current!
  t.setCaptureMode(captureMode)
  setTranscript([]); setInterim('')
  setIsRecording(true)
  await t.startRecording(handleTranscriptUpdate, setStatus)
}

const stop = async () => {
  await transcriberRef.current?.stopRecording()
  setIsRecording(false)
}
```

Render controls and live transcript (simplified):

```tsx
<div>
  <div>
    <button onClick={() => setCaptureMode('mic')} disabled={isRecording}>Microphone</button>
    <button onClick={() => setCaptureMode('both')} disabled={isRecording}>Mic + Tab Audio</button>
  </div>
  {!isRecording ? (
    <button onClick={start}>Start Recording</button>
  ) : (
    <button onClick={stop}>Stop Recording</button>
  )}
  <div>
    {transcript.map((seg, i) => (
      <div key={i}>
        <span>{seg.timestamp}</span>
        <span>{seg.text}</span>
      </div>
    ))}
    {interim && <div><em>{interim}</em></div>}
  </div>
</div>
```

---

## 5) Page Integration
Render the component on your page.

Path: `app/meeting/page.tsx`

```tsx
import MeetingTranscription from '@/components/MeetingTranscription'

export default function MeetingPage() {
  return (
    <div className="p-8">
      <h1>Meeting</h1>
      <div className="mt-8">
        <MeetingTranscription />
      </div>
    </div>
  )
}
```

---

## 6) Optional: Save to Google Drive
When not recording and transcript exists, show a Save panel and POST to a server route (e.g., `app/api/meetings/save/route.ts`) with `{ title, transcriptText, folderId }`. The server should authenticate to Google and create a Doc, returning `{ driveFileId }`.

Client call (simplified):

```ts
const resp = await fetch('/api/meetings/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title, transcriptText, folderId: 'your-folder/meetings' }),
})
const data = await resp.json()
```

Notes:
- Implement Google auth (OAuth or service account) and error messages on the server.
- Validate inputs and handle rate limits.

---

## 7) Permissions, UX & Reliability
- Mic permissions: handle `NotAllowedError` (denied) and `NotFoundError` (no mic) with clear messages.
- Tab audio: instruct users to pick the meeting/media tab and enable “Share tab audio”. If unavailable in `'both'` mode, continue with mic only.
- Audio pipeline: use `AudioContext({ sampleRate: 16000 })`; downsample if needed; convert Float32 -> Int16.
- WebSocket: retry on disconnections a few times; send `{ type: 'Terminate' }` before closing.
- Accessibility: status badge, duration timer, interim text in italics.

---

## 8) Local Testing
1) Ensure `ASSEMBLYAI_API_KEY` is set and restart dev server.
2) Open the meeting page over HTTPS (or a localhost setup that allows mic access).
3) Test Mic mode: speak and observe interim/final transcript.
4) Test Mic + Tab: share a tab with audio and ensure it transcribes.

---

## 9) Security Considerations
- Never expose the AssemblyAI API key to the browser; return short‑lived tokens from the server only.
- Keep token lifetimes short (e.g., 10 minutes).
- Optionally restrict token issuance by origin/tenant.

---

## 10) File Checklist
- Server:
  - `app/api/assembly-ai/generate-realtime-token/route.ts`
  - (Optional) `app/api/meetings/save/route.ts`
- Client:
  - `services/assembly-ai/meeting-transcriber.ts`
  - `components/MeetingTranscription.tsx`
  - `app/meeting/page.tsx`
- Config:
  - `.env.local` with `ASSEMBLYAI_API_KEY`

---

## Troubleshooting
- “Failed to start recording”: check mic permissions, HTTPS, and `ASSEMBLYAI_API_KEY`.
- “No tab audio detected”: ensure you selected the correct tab and checked “Share tab audio”. Try again.
- No transcript: verify WebSocket connects (network tab), token endpoint returns `{ token }`, and audio frames are sent.

---

References in this repo:
- `services/assembly-ai/meeting-transcriber.ts`
- `components/MeetingTranscription.tsx`
- `app/meeting/page.tsx`
- `app/api/assembly-ai/generate-realtime-token/route.ts`
