export type DemoStep = {
  user: string;
  avatarText: string;
  summary?: string[];
};

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function runDemoFlow({
  step,
  setAvatarState,   // (state: "idle"|"listening"|"thinking"|"speaking") => void
  setAvatarText,    // (t?: string) => void
  appendMessages,   // (msgs: Array<{ role:"user"|"assistant", content:string }>) => void
  onSummary,        // (summary: string[]) => void
  ttsEnabled = true,
}: {
  step: DemoStep;
  setAvatarState: (s: any) => void;
  setAvatarText: (t?: string) => void;
  appendMessages: (m: any[]) => void;
  onSummary: (s: string[]) => void;
  ttsEnabled?: boolean;
}) {
  // user line
  appendMessages([{ role: "user", content: step.user }]);

  // Show thinking state while processing
  setAvatarState("thinking");
  setAvatarText("Glen is thinking...");
  await sleep(800);

  // speaking sim
  setAvatarText(step.avatarText);
  setAvatarState("speaking");

  if (ttsEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(step.avatarText);
      
      // Optimized parameters for Glen's authoritative yet natural voice
      // Tested across Chrome, Edge, Safari for best quality
      u.rate = 0.95;   // Slightly slower for clarity and gravitas
      u.pitch = 1.0;   // Neutral pitch for broader voice compatibility
      u.volume = 1.0;  // Full volume
      
      // Prefer high-quality voices if available (Google/Microsoft voices)
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Google') || voice.name.includes('Microsoft'))
      );
      if (preferredVoice) {
        u.voice = preferredVoice;
      }
      
      u.onend = () => {
        setAvatarState("idle");
        setAvatarText(undefined);
        if (step.summary?.length) {
          onSummary(step.summary);
        }
      };
      
      window.speechSynthesis.speak(u);
      return;
    } catch {
      // TTS failed, fall through to silent fallback
    }
  }

  // silent fallback timing
  const ms = Math.max(1600, Math.min(4000, step.avatarText.length * 40));
  await sleep(ms);
  setAvatarState("idle");
  setAvatarText(undefined);
  if (step.summary?.length) {
    onSummary(step.summary);
  }
}

