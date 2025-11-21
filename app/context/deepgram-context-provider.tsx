"use client";

import {
  createClient,
  type LiveClient,
  type LiveSchema,
  LiveTranscriptionEvents,
  SOCKET_STATES,
} from "@deepgram/sdk";

import {
  createContext,
  type FunctionComponent,
  type ReactNode,
  useContext,
  useState,
} from "react";

export type { LiveTranscriptionEvent } from "@deepgram/sdk";
// biome-ignore lint/performance/noBarrelFile: Re-exporting Deepgram enums for convenience
export {
  LiveTranscriptionEvents,
  SOCKET_STATES as LiveConnectionState,
} from "@deepgram/sdk";

type DeepgramContextType = {
  connection: LiveClient | null;
  connectToDeepgram: (options: LiveSchema, endpoint?: string) => Promise<void>;
  disconnectFromDeepgram: () => void;
  connectionState: SOCKET_STATES;
};

const DeepgramContext = createContext<DeepgramContextType | undefined>(
  undefined
);

type DeepgramContextProviderProps = {
  children: ReactNode;
};

const getToken = async (): Promise<string> => {
  const response = await fetch("/api/voice/deepgram-token", {
    method: "POST",
    cache: "no-store",
  });
  const result = await response.json();
  return result.token; // Our endpoint returns {token, expires_in}
};

const DeepgramContextProvider: FunctionComponent<
  DeepgramContextProviderProps
> = ({ children }) => {
  const [connection, setConnection] = useState<LiveClient | null>(null);
  const [connectionState, setConnectionState] = useState<SOCKET_STATES>(
    SOCKET_STATES.closed
  );

  /**
   * Connects to the Deepgram speech recognition service and sets up a live transcription session.
   *
   * @param options - The configuration options for the live transcription session.
   * @param endpoint - The optional endpoint URL for the Deepgram service.
   * @returns A Promise that resolves when the connection is established.
   */
  const connectToDeepgram = async (options: LiveSchema, endpoint?: string) => {
    console.log("DeepgramContext: Getting token...");
    const token = await getToken();
    console.log("DeepgramContext: Token received, creating client...");
    const deepgram = createClient({ accessToken: token }); // Use token directly

    console.log("DeepgramContext: Creating live connection...");
    const conn = deepgram.listen.live(options, endpoint);

    conn.addListener(LiveTranscriptionEvents.Open, () => {
      console.log("DeepgramContext: WebSocket OPEN event received");
      setConnectionState(SOCKET_STATES.open);
    });

    conn.addListener(LiveTranscriptionEvents.Close, () => {
      console.log("DeepgramContext: WebSocket CLOSE event received");
      setConnectionState(SOCKET_STATES.closed);
    });

    conn.addListener(LiveTranscriptionEvents.Metadata, (data: any) => {
      console.log("DeepgramContext: Metadata received", data);
    });

    conn.addListener(LiveTranscriptionEvents.Error, (error: any) => {
      console.error("DeepgramContext: Error", error);
    });

    console.log("DeepgramContext: Setting connection");
    setConnection(conn);
  };

  const disconnectFromDeepgram = () => {
    if (connection) {
      connection.finish();
      setConnection(null);
    }
  };

  return (
    <DeepgramContext.Provider
      value={{
        connection,
        connectToDeepgram,
        disconnectFromDeepgram,
        connectionState,
      }}
    >
      {children}
    </DeepgramContext.Provider>
  );
};

function useDeepgram(): DeepgramContextType {
  const context = useContext(DeepgramContext);
  if (context === undefined) {
    throw new Error(
      "useDeepgram must be used within a DeepgramContextProvider"
    );
  }
  return context;
}

export { DeepgramContextProvider, useDeepgram };
