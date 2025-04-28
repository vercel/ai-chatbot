'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useState, useEffect, useRef } from 'react';
import { OrbitVisualizer } from './orbit-visualizer';
import { ConversationControls } from './conversation-controls';
import { ConversationHeader } from './conversation-header';

interface Message {
  message: string;
  timestamp: number;
}

export function Conversation() {
  const dummyMessages = [{
        message: 'Hello, how are you?',
        timestamp: Date.now()
      },{
        message: 'I am fine, thank you!',
        timestamp: Date.now()
      },{
        message: 'What is your name?',
        timestamp: Date.now()
      },{
        message: 'I understand this is a challenging situation [Acknowledge]. As your career coach, I need to focus on your professional development rather than [off-topic area] [Set Boundary]. However, I\'d be happy to discuss how this might impact your work performance and career goals [Redirect]. Would you like to explore strategies for maintaining professional growth during this time? [Transition]',
        timestamp: Date.now()
      },{
        message: 'What is your favorite color?',
        timestamp: Date.now()
      },{
        message: 'I am a chatbot.',
        timestamp: Date.now()
      },{
        message: 'What is your favorite color?',
        timestamp: Date.now()
    },
  {
        message: 'I understand this is a challenging situation [Acknowledge]. As your career coach, I need to focus on your professional development rather than [off-topic area] [Set Boundary]. However, I\'d be happy to discuss how this might impact your work performance and career goals [Redirect]. Would you like to explore strategies for maintaining professional growth during this time? [Transition]',
        timestamp: Date.now()
    },
  {
        message: 'I understand this is a challenging situation [Acknowledge]. As your career coach, I need to focus on your professional development rather than [off-topic area] [Set Boundary]. However, I\'d be happy to discuss how this might impact your work performance and career goals [Redirect]. Would you like to explore strategies for maintaining professional growth during this time? [Transition]',
        timestamp: Date.now()
    },
  {
        message: 'I understand this is a challenging situation [Acknowledge]. As your career coach, I need to focus on your professional development rather than [off-topic area] [Set Boundary]. However, I\'d be happy to discuss how this might impact your work performance and career goals [Redirect]. Would you like to explore strategies for maintaining professional growth during this time? [Transition]',
        timestamp: Date.now()
    },
  {
        message: 'I understand this is a challenging situation [Acknowledge]. As your career coach, I need to focus on your professional development rather than [off-topic area] [Set Boundary]. However, I\'d be happy to discuss how this might impact your work performance and career goals [Redirect]. Would you like to explore strategies for maintaining professional growth during this time? [Transition]',
        timestamp: Date.now()
    },
  ];

  const [isMuted, setIsMuted] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  // const [messages, setMessages] = useState<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>([...dummyMessages]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected');
      // Initialize audio context when connected
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
      }
    },
    onDisconnect: () => {
      console.log('Disconnected');
      setConversationId(null);
      setMessages([]);
      // Clean up audio context when disconnected
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        gainNodeRef.current = null;
      }
    },
    onMessage: (message) => {
      console.log('Message:', message);
      // Handle audio playback through the gain node
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = isMuted ? 0 : 1;
      }
      // Add message to the list
      setMessages(prev => [...prev, {
        message: message.message,
        timestamp: Date.now()
      }]);
      // setMessages([{
      //   message: message.message,
      //   timestamp: Date.now()
      // }]);
    },
    onError: (error) => console.error('Error:', error),
  });

  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const conversationId = await conversation.startSession({
        agentId: '5Ui9poIvGJrOjlC9iMZZ',  // Agent ID for CoCo kept here for now.
      });
      setConversationId(conversationId);
      console.log('Started conversation with ID:', conversationId);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    if (conversationId) {
      console.log('Ending conversation with ID:', conversationId);
    }
    await conversation.endSession();
  }, [conversation, conversationId]);

  const handleMuteToggle = useCallback(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 1 : 0;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const getOrbState = () => {
    if (conversation.status !== 'connected') return 'idle';
    return conversation.isSpeaking ? 'speaking' : 'listening';
  };

  // Clean up audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        {/* Conversation Header */} 
        <ConversationHeader />

        {/* Message Display */}
        <div className="flex flex-col min-w-0 flex-1 overflow-y-scroll">
          <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full pl-14 pr-4 py-6">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className="text-foreground/90 text-base leading-relaxed animate-fade-in dark:text-white/90"
              >
                {message.message}
              </div>
            ))}
          </div>
        </div>

        {/* Orbit Visualizer and Conversation Controls */}
        <div className="sticky bottom-0 p-4 bg-background">
          <OrbitVisualizer state={getOrbState()} />
          <ConversationControls
            onStart={startConversation}
            onStop={stopConversation}
            onMuteToggle={handleMuteToggle}
            isConnected={conversation.status === 'connected'}
            isSpeaking={conversation.isSpeaking}
            isMuted={isMuted}
            conversationId={conversationId || ''}
          />
        </div>
      </div>
    </>
    
  );
}
