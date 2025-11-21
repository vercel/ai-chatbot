/**
 * Speech-to-Text (STT) Transcription API Route
 *
 * **Endpoint**: POST /api/voice/transcribe
 *
 * **Purpose**: Transcribes audio input to text using Groq's Whisper large-v3 model.
 * Accepts audio files in various formats (WAV, WebM, MP3, etc.) and returns
 * the transcribed text as JSON.
 *
 * **Used By**:
 * - `hooks/use-voice-input.ts` - Both VAD and PTT modes send audio here
 * - Called after user stops speaking (VAD) or stops recording (PTT)
 *
 * **Request Format**:
 * - Method: POST
 * - Content-Type: multipart/form-data
 * - Body: FormData with "audio" field containing audio file
 *
 * **Audio File**:
 * - Field name: "audio"
 * - Supported formats: WAV, WebM, MP3, M4A, etc. (Whisper accepts most formats)
 * - VAD sends: WAV format (encoded from Float32Array)
 * - PTT sends: WebM format with opus codec (browser MediaRecorder output)
 *
 * **Response**:
 * - Success (200): `{ transcript: "transcribed text here" }`
 * - Error (400): No audio file, or empty transcription
 * - Error (500): GROQ_API_KEY not configured, or API failure
 *
 * **Groq Whisper Model**:
 * - Model: whisper-large-v3
 * - Provider: Groq (https://groq.com)
 * - Features: Multi-language support, high accuracy, fast inference
 * - Speed: ~500-1000ms typical transcription time
 * - Languages: 99+ languages supported (auto-detected)
 *
 * **Environment Variables Required**:
 * - GROQ_API_KEY: Get from https://console.groq.com/keys
 *
 * **Error Handling**:
 * - Empty audio returns 400 "No transcript generated"
 * - API failures return 500 "Transcription failed"
 * - All errors logged to console for debugging
 *
 * **Flow**:
 * 1. Client captures audio (VAD or PTT)
 * 2. Audio sent as FormData multipart upload
 * 3. Server extracts File from FormData
 * 4. Validates file exists and API key configured
 * 5. Calls Groq Whisper API with audio file
 * 6. Returns trimmed transcript text
 * 7. Client displays text in chat input field
 *
 * @param request - Next.js request with FormData containing audio file
 * @returns JSON response with transcript or error message
 *
 * @example
 * ```typescript
 * // Client-side usage (from use-voice-input.ts):
 * const formData = new FormData();
 * formData.append("audio", audioBlob, "audio.wav");
 *
 * const response = await fetch("/api/voice/transcribe", {
 *   method: "POST",
 *   body: formData,
 * });
 *
 * const { transcript } = await response.json();
 * setInput(transcript); // Display in chat input
 * ```
 *
 * @see hooks/use-voice-input.ts - Audio capture and API caller
 * @see https://console.groq.com/docs/speech-text - Groq Whisper API docs
 */
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * POST handler for audio transcription.
 *
 * Accepts audio file via FormData and returns transcribed text via Groq Whisper.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
    });

    const transcript = transcription.text.trim();

    if (!transcript) {
      return NextResponse.json(
        { error: "No transcript generated" },
        { status: 400 }
      );
    }

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }
}
