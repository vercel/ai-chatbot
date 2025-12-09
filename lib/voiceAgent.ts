/**
 * TiQology Voice Agent Module
 * Handles speech-to-text, text-to-speech, and voice commands
 */

import type { AgentResult, AgentTask } from "./agentos/types";

// ============================================
// TYPES
// ============================================

export interface VoiceCommand {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  rawTranscript: string;
}

export interface VoiceAgentConfig {
  sttProvider: "openai-whisper" | "google" | "deepgram";
  ttsProvider: "elevenlabs" | "google" | "openai";
  voiceId?: string; // For ElevenLabs/Google
  language?: string;
}

// ============================================
// VOICE COMMANDS
// ============================================

const VOICE_COMMAND_PATTERNS = [
  {
    pattern: /(?:start|begin|create|make) (?:a |an )?evaluation/i,
    intent: "start_evaluation",
    targetAgent: "ghost-evaluator",
  },
  {
    pattern: /(?:show|display|get) (?:my )?earnings/i,
    intent: "show_earnings",
    targetAgent: null, // UI navigation
  },
  {
    pattern: /(?:find|show|locate) missions (?:near me|nearby)/i,
    intent: "find_missions",
    targetAgent: null,
  },
  {
    pattern: /(?:what is|what's) my (?:level|xp|experience)/i,
    intent: "show_level",
    targetAgent: null,
  },
  {
    pattern: /share (?:with|to) (.+)/i,
    intent: "share_item",
    targetAgent: null,
    extractEntity: (match: RegExpMatchArray) => ({ friendName: match[1] }),
  },
  {
    pattern: /evaluate (.+)/i,
    intent: "evaluate_text",
    targetAgent: "ghost-evaluator",
    extractEntity: (match: RegExpMatchArray) => ({ text: match[1] }),
  },
];

// ============================================
// SPEECH-TO-TEXT (STT)
// ============================================

/**
 * Transcribe audio to text using OpenAI Whisper
 */
export async function transcribeAudio(
  audioData: Buffer | Blob,
  config: VoiceAgentConfig = {
    sttProvider: "openai-whisper",
    ttsProvider: "openai",
  }
): Promise<string> {
  const { sttProvider, language = "en" } = config;

  switch (sttProvider) {
    case "openai-whisper":
      return await transcribeWithWhisper(audioData, language);

    case "google":
      return await transcribeWithGoogle(audioData, language);

    case "deepgram":
      return await transcribeWithDeepgram(audioData, language);

    default:
      throw new Error(`Unsupported STT provider: ${sttProvider}`);
  }
}

async function transcribeWithWhisper(
  audioData: Buffer | Blob,
  language: string
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", new Blob([audioData]), "audio.webm");
    formData.append("model", "whisper-1");
    formData.append("language", language);

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.text;
  } catch (error) {
    console.error("[Voice] Whisper transcription error:", error);
    throw error;
  }
}

async function transcribeWithGoogle(
  audioData: Buffer | Blob,
  language: string
): Promise<string> {
  // Implementation for Google Cloud Speech-to-Text
  // Requires @google-cloud/speech package
  throw new Error("Google STT not implemented yet");
}

async function transcribeWithDeepgram(
  audioData: Buffer | Blob,
  language: string
): Promise<string> {
  // Implementation for Deepgram API
  throw new Error("Deepgram STT not implemented yet");
}

// ============================================
// TEXT-TO-SPEECH (TTS)
// ============================================

/**
 * Convert text to speech audio
 */
export async function synthesizeSpeech(
  text: string,
  config: VoiceAgentConfig = {
    sttProvider: "openai-whisper",
    ttsProvider: "openai",
  }
): Promise<Buffer> {
  const { ttsProvider, voiceId = "alloy" } = config;

  switch (ttsProvider) {
    case "openai":
      return await synthesizeWithOpenAI(text, voiceId);

    case "elevenlabs":
      return await synthesizeWithElevenLabs(text, voiceId);

    case "google":
      return await synthesizeWithGoogle(text, voiceId);

    default:
      throw new Error(`Unsupported TTS provider: ${ttsProvider}`);
  }
}

async function synthesizeWithOpenAI(
  text: string,
  voice: string
): Promise<Buffer> {
  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        voice, // alloy, echo, fable, onyx, nova, shimmer
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI TTS error: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("[Voice] OpenAI TTS error:", error);
    throw error;
  }
}

async function synthesizeWithElevenLabs(
  text: string,
  voiceId: string
): Promise<Buffer> {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS error: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("[Voice] ElevenLabs TTS error:", error);
    throw error;
  }
}

async function synthesizeWithGoogle(
  text: string,
  voiceId: string
): Promise<Buffer> {
  // Implementation for Google Cloud Text-to-Speech
  throw new Error("Google TTS not implemented yet");
}

// ============================================
// COMMAND PARSING
// ============================================

/**
 * Parse voice transcript into structured command
 */
export function parseVoiceCommand(transcript: string): VoiceCommand | null {
  const normalizedText = transcript.trim().toLowerCase();

  for (const pattern of VOICE_COMMAND_PATTERNS) {
    const match = normalizedText.match(pattern.pattern);
    if (match) {
      const entities = pattern.extractEntity
        ? pattern.extractEntity(match)
        : {};

      return {
        intent: pattern.intent,
        entities,
        confidence: 0.9, // Would use NLP model for real confidence
        rawTranscript: transcript,
      };
    }
  }

  // No pattern matched, use AI to extract intent
  return {
    intent: "unknown",
    entities: { text: transcript },
    confidence: 0.3,
    rawTranscript: transcript,
  };
}

/**
 * Execute voice command
 */
export async function executeVoiceCommand(
  command: VoiceCommand,
  userId: string
): Promise<AgentResult> {
  console.log("[Voice] Executing command:", command);

  switch (command.intent) {
    case "start_evaluation":
      // Route to Ghost evaluator
      return {
        taskId: "voice_eval_" + Date.now(),
        agentId: "voice-agent",
        status: "completed",
        data: {
          action: "navigate",
          route: "/ghost-lab",
          message: "Opening Ghost Lab for evaluation",
        },
        executionTrace: [],
        error: null,
      };

    case "show_earnings":
      return {
        taskId: "voice_earnings_" + Date.now(),
        agentId: "voice-agent",
        status: "completed",
        data: {
          action: "navigate",
          route: "/earn-hub",
          message: "Opening your earnings dashboard",
        },
        executionTrace: [],
        error: null,
      };

    case "find_missions":
      return {
        taskId: "voice_missions_" + Date.now(),
        agentId: "voice-agent",
        status: "completed",
        data: {
          action: "navigate",
          route: "/fan-ops",
          message: "Finding missions near you",
        },
        executionTrace: [],
        error: null,
      };

    case "show_level":
      return {
        taskId: "voice_level_" + Date.now(),
        agentId: "voice-agent",
        status: "completed",
        data: {
          action: "navigate",
          route: "/profile",
          message: "Opening your profile",
        },
        executionTrace: [],
        error: null,
      };

    case "evaluate_text": {
      // Create evaluation task for Ghost
      const evaluationTask: AgentTask = {
        id: "voice_eval_" + Date.now(),
        origin: "voice-agent",
        targetAgents: ["ghost-evaluator"],
        domain: "general",
        kind: "evaluation",
        priority: "normal",
        payload: {
          prompt: command.entities.text,
          modelType: "chat-model",
          userId,
        },
        metadata: {
          source: "voice_command",
          originalTranscript: command.rawTranscript,
        },
      };

      // Would route through AgentOS in production
      return {
        taskId: evaluationTask.id,
        agentId: "voice-agent",
        status: "pending",
        data: {
          action: "route_to_agent",
          task: evaluationTask,
          message: "Processing your evaluation",
        },
        executionTrace: [],
        error: null,
      };
    }

    default:
      return {
        taskId: "voice_unknown_" + Date.now(),
        agentId: "voice-agent",
        status: "failed",
        data: null,
        executionTrace: [],
        error: {
          code: "UNKNOWN_COMMAND",
          message: `I didn't understand the command: "${command.rawTranscript}"`,
          details: { command },
        },
      };
  }
}

// ============================================
// VOICE AGENT HANDLER
// ============================================

/**
 * Main voice agent handler (called from AgentOS router)
 */
export async function handleVoiceAgent(task: AgentTask): Promise<AgentResult> {
  const startTime = Date.now();
  const trace: string[] = [];

  try {
    trace.push("Voice agent started");

    // Extract audio data from task payload
    const audioData = task.payload.audioInput;
    if (!audioData) {
      throw new Error("No audio input provided");
    }

    // Transcribe audio
    trace.push("Transcribing audio...");
    const transcript = await transcribeAudio(
      Buffer.from(audioData, "base64"),
      task.payload.config
    );
    trace.push(`Transcript: "${transcript}"`);

    // Parse command
    const command = parseVoiceCommand(transcript);
    if (!command) {
      throw new Error("Could not parse voice command");
    }
    trace.push(`Command intent: ${command.intent}`);

    // Execute command
    const result = await executeVoiceCommand(command, task.payload.userId);
    trace.push(`Command executed: ${result.status}`);

    // If response text is provided, synthesize speech
    let audioResponse: string | undefined;
    if (result.data?.message) {
      trace.push("Synthesizing speech response...");
      const audioBuffer = await synthesizeSpeech(
        result.data.message,
        task.payload.config
      );
      audioResponse = audioBuffer.toString("base64");
      trace.push("Speech synthesis complete");
    }

    return {
      taskId: task.id,
      agentId: "voice-agent",
      status: "completed",
      data: {
        transcript,
        command,
        action: result.data?.action,
        route: result.data?.route,
        message: result.data?.message,
        audioResponse,
      },
      executionTrace: trace,
      error: null,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        sttProvider: task.payload.config?.sttProvider || "openai-whisper",
        ttsProvider: task.payload.config?.ttsProvider || "openai",
      },
    };
  } catch (error) {
    trace.push(
      `Error: ${error instanceof Error ? error.message : "Unknown error"}`
    );

    return {
      taskId: task.id,
      agentId: "voice-agent",
      status: "failed",
      data: null,
      executionTrace: trace,
      error: {
        code: "VOICE_AGENT_ERROR",
        message:
          error instanceof Error ? error.message : "Voice processing failed",
        details: { error },
      },
    };
  }
}

// ============================================
// ENVIRONMENT VALIDATION
// ============================================

export function validateVoiceAgentConfig(): {
  isValid: boolean;
  missingKeys: string[];
} {
  const requiredKeys = ["OPENAI_API_KEY"];
  const optionalKeys = ["ELEVENLABS_API_KEY", "GOOGLE_CLOUD_API_KEY"];

  const missingKeys = requiredKeys.filter((key) => !process.env[key]);

  return {
    isValid: missingKeys.length === 0,
    missingKeys,
  };
}
