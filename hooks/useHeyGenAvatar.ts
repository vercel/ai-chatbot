'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
  VoiceEmotion,
} from '@heygen/streaming-avatar';

export function useHeyGenAvatar() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarRef = useRef<StreamingAvatar | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startSession = useCallback(async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_HEYGEN_API_KEY;
      const avatarId = process.env.NEXT_PUBLIC_HEYGEN_AVATAR_ID;

      if (!apiKey) {
        console.log('HeyGen disabled - no API key');
        return;
      }

      setIsConnecting(true);
      setError(null);

      // Create avatar instance
      const avatar = new StreamingAvatar({
        token: apiKey,
      });

      avatarRef.current = avatar;

      // Set up event listeners
      avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
        console.log('Avatar started talking');
      });

      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        console.log('Avatar stopped talking');
      });

      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        console.log('Stream ready:', event);
        if (videoRef.current && event.detail) {
          videoRef.current.srcObject = event.detail;
          mediaStreamRef.current = event.detail;
        }
      });

      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log('Stream disconnected');
        setIsConnected(false);
      });

      // Create streaming session
      const sessionInfo = await avatar.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: avatarId || '613c8b767442457fad29cff44acbf3a2',
        voice: {
          voiceId: process.env.NEXT_PUBLIC_HEYGEN_VOICE_ID,
        },
      });

      console.log('Session created:', sessionInfo);
      setIsConnected(true);
      setIsConnecting(false);
    } catch (err) {
      console.error('HeyGen error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start avatar');
      setIsConnecting(false);
      setIsConnected(false);
    }
  }, []);

  const stopSession = useCallback(async () => {
    try {
      if (avatarRef.current) {
        await avatarRef.current.stopAvatar();
        avatarRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      setIsConnected(false);
    } catch (err) {
      console.error('Error stopping session:', err);
    }
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!avatarRef.current || !isConnected) {
      console.warn('Cannot speak: not connected');
      return;
    }

    try {
      await avatarRef.current.speak({
        text,
        taskType: TaskType.REPEAT,
      });
    } catch (err) {
      console.error('Error sending speech:', err);
    }
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (avatarRef.current) {
        avatarRef.current.stopAvatar().catch(console.error);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    isConnecting,
    isConnected,
    error,
    startSession,
    stopSession,
    speak,
  };
}

