"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

type MicrophoneContextType = {
  microphone: MediaRecorder | null;
  startMicrophone: () => void;
  stopMicrophone: () => void;
  setupMicrophone: () => void;
  microphoneState: MicrophoneState | null;
  mediaStream: MediaStream | null;
};

export const MicrophoneEvents = {
  DataAvailable: "dataavailable",
  Error: "error",
  Pause: "pause",
  Resume: "resume",
  Start: "start",
  Stop: "stop",
} as const;

export type MicrophoneEvents =
  (typeof MicrophoneEvents)[keyof typeof MicrophoneEvents];

export const MicrophoneState = {
  NotSetup: -1,
  SettingUp: 0,
  Ready: 1,
  Opening: 2,
  Open: 3,
  Error: 4,
  Pausing: 5,
  Paused: 6,
} as const;

export type MicrophoneState =
  (typeof MicrophoneState)[keyof typeof MicrophoneState];

const MicrophoneContext = createContext<MicrophoneContextType | undefined>(
  undefined
);

type MicrophoneContextProviderProps = {
  children: ReactNode;
};

const MicrophoneContextProvider: React.FC<MicrophoneContextProviderProps> = ({
  children,
}) => {
  const [microphoneState, setMicrophoneState] = useState<MicrophoneState>(
    MicrophoneState.NotSetup
  );
  const [microphone, setMicrophone] = useState<MediaRecorder | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const setupMicrophone = async () => {
    console.log("MicrophoneContext: Setting up microphone...");
    setMicrophoneState(MicrophoneState.SettingUp);

    try {
      console.log("MicrophoneContext: Requesting user media...");
      const userMedia = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
        },
      });

      console.log(
        "MicrophoneContext: User media granted, creating MediaRecorder"
      );
      const newMicrophone = new MediaRecorder(userMedia);

      console.log(
        "MicrophoneContext: MediaRecorder created, setting state to Ready"
      );
      setMicrophoneState(MicrophoneState.Ready);
      setMicrophone(newMicrophone);
      setMediaStream(userMedia);
    } catch (err: any) {
      console.error("MicrophoneContext: Setup error:", err);

      throw err;
    }
  };

  const stopMicrophone = useCallback(() => {
    console.log("MicrophoneContext: Stopping microphone and all tracks...");
    setMicrophoneState(MicrophoneState.Pausing);

    // Stop the MediaRecorder
    if (microphone?.state === "recording" || microphone?.state === "paused") {
      console.log(
        "MicrophoneContext: Stopping MediaRecorder, current state:",
        microphone.state
      );
      microphone.stop();
    }

    // Stop all tracks on the MediaStream to release the microphone
    if (mediaStream) {
      console.log("MicrophoneContext: Stopping all MediaStream tracks...");
      for (const track of mediaStream.getTracks()) {
        console.log(
          "MicrophoneContext: Stopping track:",
          track.kind,
          "enabled:",
          track.enabled
        );
        track.stop();
      }
    }

    // Clear the microphone and stream references
    setMicrophone(null);
    setMediaStream(null);
    setMicrophoneState(MicrophoneState.NotSetup);
    console.log("MicrophoneContext: Microphone fully stopped and cleaned up");
  }, [microphone, mediaStream]);

  const startMicrophone = useCallback(() => {
    if (!microphone || !mediaStream) {
      console.log(
        "MicrophoneContext: Cannot start - microphone or stream not available"
      );
      return;
    }

    console.log(
      "MicrophoneContext: Starting microphone, state:",
      microphone.state
    );
    setMicrophoneState(MicrophoneState.Opening);

    if (microphone.state === "paused") {
      console.log("MicrophoneContext: Resuming paused microphone");
      microphone.resume();
    } else if (microphone.state === "inactive") {
      console.log(
        "MicrophoneContext: Starting fresh microphone with 250ms chunks"
      );
      microphone.start(250);
    } else {
      console.log(
        "MicrophoneContext: Microphone already in state:",
        microphone.state
      );
    }

    setMicrophoneState(MicrophoneState.Open);
    console.log("MicrophoneContext: Microphone state set to Open");
  }, [microphone, mediaStream]);

  return (
    <MicrophoneContext.Provider
      value={{
        microphone,
        startMicrophone,
        stopMicrophone,
        setupMicrophone,
        microphoneState,
        mediaStream,
      }}
    >
      {children}
    </MicrophoneContext.Provider>
  );
};

function useMicrophone(): MicrophoneContextType {
  const context = useContext(MicrophoneContext);

  if (context === undefined) {
    throw new Error(
      "useMicrophone must be used within a MicrophoneContextProvider"
    );
  }

  return context;
}

export { MicrophoneContextProvider, useMicrophone };
