import { useState } from 'react';
import { Button } from '../ui/button';
import { SpeechToTextIcon } from './icons';
import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
  LanguageCode,
} from '@aws-sdk/client-transcribe-streaming';
import MicrophoneStream from 'microphone-stream';

export function AudioTranscriberInput({
  isLoading,
  onTextUpdated,
  onStopTranscribe,
}: {
  isLoading: boolean;
  onTextUpdated: (text: string) => void;
  onStopTranscribe: () => void;
}) {
  let microphoneStream: MicrophoneStream;
  const language = 'en-US';
  const SAMPLE_RATE = 44100;
  let transcribeClient: TranscribeStreamingClient;
  const [isRecording, setIsRecording] = useState(false);
  let currentText = '';

  const createTranscribeClient = () => {
    transcribeClient = new TranscribeStreamingClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'YOUR_ACCESS_KEY_ID',
        secretAccessKey: 'Your Secret',
      },
    });
  };

  const encodePCMChunk = (chunk: Buffer) => {
    const input = MicrophoneStream.toRaw(chunk);
    let offset = 0;
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return Buffer.from(buffer);
  };

  const getAudioStream = async function* () {
    for await (const chunk of microphoneStream) {
      if (chunk.length <= SAMPLE_RATE) {
        yield {
          AudioEvent: {
            AudioChunk: encodePCMChunk(chunk),
          },
        };
      }
    }
  };

  const startStreaming = async (
    language: LanguageCode,
    callback: (text: string) => void
  ) => {
    const command = new StartStreamTranscriptionCommand({
      LanguageCode: language,
      MediaEncoding: 'pcm',
      MediaSampleRateHertz: SAMPLE_RATE,
      AudioStream: getAudioStream(),
    });
    const data = await transcribeClient.send(command);
    if (!data.TranscriptResultStream) {
      console.error('No transcript result stream');
    }
    for await (const event of data.TranscriptResultStream) {
      const results = event.TranscriptEvent?.Transcript?.Results;
      if (results?.length && !results[0]?.IsPartial) {
        const newTranscript = results[0].Alternatives?.[0]?.Transcript;
        callback(newTranscript + ' ');
      }
    }
  };

  const createMicrophoneStream = async () => {
    microphoneStream = new MicrophoneStream();
    microphoneStream.setStream(
      await window.navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      })
    );
  };

  const stopRecording = function () {
    setIsRecording(false);
    if (microphoneStream) {
      microphoneStream.stop();
    }
    onStopTranscribe();
  };
  const startRecording = async () => {
    setIsRecording(true);
    if (microphoneStream || transcribeClient) {
      stopRecording();
    }
    currentText = '';
    createTranscribeClient();
    createMicrophoneStream();
    await startStreaming(language, (text: string) => {
      currentText += ' ' + text;
      onTextUpdated(currentText);
    });
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <>
      <Button
        className="rounded-full p-1.5 h-fit absolute bottom-2 right-20 m-0.5 dark:border-zinc-700"
        onClick={(event) => {
          event.preventDefault();
          toggleRecording();
        }}
        variant="outline"
        disabled={isLoading}
      >
        <SpeechToTextIcon size={14} color={isRecording ? 'red' : 'white'} />
      </Button>
    </>
  );
}
