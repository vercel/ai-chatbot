'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface MeetingSession {
  url: string;
  isRecording: boolean;
  recordingState: 'inactive' | 'recording' | 'paused';
  startTime: Date;
}

interface CalendarCredentials {
  clientId: string;
  clientSecret: string;
  calendarId: string;
}

export function MeetsTab() {
  const { toast } = useToast();
  const [meetingUrl, setMeetingUrl] = useState('');
  const [activeSession, setActiveSession] = useState<MeetingSession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startMeetingSession = (url: string) => {
    if (!url) {
      toast({
        title: 'Error',
        description: 'Please enter a valid meeting URL',
        variant: 'destructive',
      });
      return;
    }

    try {
      new URL(url);
      setActiveSession({
        url,
        isRecording: false,
        recordingState: 'inactive',
        startTime: new Date(),
      });
      setIsModalOpen(true);
    } catch {
      toast({
        title: 'Error',
        description: 'Please enter a valid URL',
        variant: 'destructive',
      });
    }
  };

  const startRecording = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false 
      });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((chunks) => [...chunks, event.data]);
        }
      };

      recorder.start(1000);
      setMediaRecorder(recorder);
      
      if (activeSession) {
        setActiveSession({
          ...activeSession,
          isRecording: true,
          recordingState: 'recording',
        });
      }

      toast({
        title: 'Recording Started',
        description: 'Your meeting is now being recorded',
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Error',
        description: 'Failed to start recording',
        variant: 'destructive',
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      setIsRecordingPaused(true);
      if (activeSession) {
        setActiveSession({
          ...activeSession,
          recordingState: 'paused',
        });
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      setIsRecordingPaused(false);
      if (activeSession) {
        setActiveSession({
          ...activeSession,
          recordingState: 'recording',
        });
      }
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder && activeSession) {
      mediaRecorder.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
      
      const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
      
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('title', `Session Recording ${new Date().toLocaleString()}`);
        formData.append('meetingUrl', activeSession.url);
        
        const response = await fetch('/api/recordings', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to save recording');
        }

        toast({
          title: 'Recording Saved',
          description: 'Your recording has been saved successfully',
        });
      } catch (error) {
        console.error('Error saving recording:', error);
        toast({
          title: 'Error',
          description: 'Failed to save recording',
          variant: 'destructive',
        });
      }

      setRecordedChunks([]);
      setMediaRecorder(null);
      setActiveSession({
        ...activeSession,
        isRecording: false,
        recordingState: 'inactive',
      });
    }
  };

  const handleCloseModal = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      if (window.confirm('Recording in progress. Do you want to stop and discard it?')) {
        mediaRecorder.stop();
        streamRef.current?.getTracks().forEach(track => track.stop());
        setRecordedChunks([]);
        setMediaRecorder(null);
      } else {
        return;
      }
    }
    setIsModalOpen(false);
    setActiveSession(null);
  };

  const handleCalendarSetup = async (credentials: CalendarCredentials) => {
    // Here you would implement the calendar integration using the user-provided credentials
    toast({
      title: 'Calendar Integration',
      description: 'Calendar credentials saved successfully',
    });
    setIsCalendarModalOpen(false);
  };

  if (!isMounted) {
    return null; // Return null on server-side and first render
  }

  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="flex space-x-2">
        <Input
          placeholder="Enter meeting URL"
          value={meetingUrl}
          onChange={(e) => setMeetingUrl(e.target.value)}
          className="flex-1"
        />
        <Button onClick={() => startMeetingSession(meetingUrl)}>
          Join Meeting
        </Button>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={() => setIsCalendarModalOpen(true)} 
          variant="outline"
        >
          Connect Calendar
        </Button>
      </div>

      {isModalOpen && (
        <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-full h-[90vh] p-0">
            <DialogHeader className="absolute top-4 right-4 z-50 flex items-center space-x-4">
              {activeSession && (
                <div className="flex items-center space-x-2">
                  {activeSession.recordingState === 'inactive' ? (
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={startRecording}
                    >
                      Record
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className={cn(
                          'rounded-full',
                          activeSession.recordingState === 'recording' && 'bg-red-500'
                        )}
                        onClick={() =>
                          isRecordingPaused ? resumeRecording() : pauseRecording()
                        }
                      >
                        {isRecordingPaused ? 'Resume' : 'Pause'}
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={stopRecording}
                      >
                        Stop
                      </Button>
                    </>
                  )}
                </div>
              )}
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setIsSideMenuOpen(true)}
              >
                Menu
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={handleCloseModal}
              >
                Close
              </Button>
            </DialogHeader>
            <iframe
              src={activeSession?.url}
              className="w-full h-full border-0"
              allow="camera; microphone; fullscreen; display-capture"
            />
          </DialogContent>
        </Dialog>
      )}

      <Sheet open={isSideMenuOpen} onOpenChange={setIsSideMenuOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Meeting Controls</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <h3 className="font-medium mb-2">Meeting Info</h3>
            {activeSession && (
              <>
                <p className="text-sm mb-4">
                  Started at: {activeSession.startTime.toLocaleTimeString()}
                </p>
                <p className="text-sm mb-4">
                  Status: {activeSession.recordingState}
                </p>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isCalendarModalOpen} onOpenChange={setIsCalendarModalOpen}>
        <DialogContent>
          <DialogHeader>
            <h2 className="text-lg font-semibold">Connect Your Calendar</h2>
          </DialogHeader>
          <Form>
            <FormField
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter your Google Calendar Client ID" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="clientSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Secret</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Enter your Client Secret" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="calendarId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calendar ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter your Calendar ID" />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button 
              className="mt-4" 
              onClick={() => handleCalendarSetup({
                clientId: '',
                clientSecret: '',
                calendarId: ''
              })}
            >
              Connect
            </Button>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 