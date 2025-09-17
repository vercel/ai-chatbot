'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, MonitorX, Loader2 } from 'lucide-react';

interface BrowserFrame {
  type: 'frame';
  data: string; // Base64 encoded image
  timestamp: number;
  sessionId: string;
}

interface BrowserPanelProps {
  sessionId?: string;
  isVisible: boolean;
  onToggle: (visible: boolean) => void;
}

export function BrowserPanel({ sessionId = 'default', isVisible, onToggle }: BrowserPanelProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastFrame, setLastFrame] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(Date.now());

  const connectToBrowserStream = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Get WebSocket connection info from our API
      const response = await fetch(`/api/browser-stream?sessionId=${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const connectionInfo = await response.json();

      if (connectionInfo.error) {
        throw new Error(connectionInfo.error);
      }

      // Connect to the browser streaming WebSocket
      const ws = new WebSocket(connectionInfo.url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to browser streaming service');
        setIsConnected(true);
        setIsConnecting(false);
        
        // Request streaming to start
        ws.send(JSON.stringify({
          type: 'start-streaming',
          sessionId
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'frame':
              handleBrowserFrame(message as BrowserFrame);
              break;
              
            case 'streaming-started':
              console.log('Browser streaming started:', message.sessionId);
              break;
              
            case 'streaming-stopped':
              console.log('Browser streaming stopped:', message.sessionId);
              break;
              
            case 'error':
              console.error('Browser streaming error:', message.error);
              setError(message.error);
              break;
              
            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from browser streaming service');
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
        setIsConnecting(false);
      };

    } catch (err) {
      console.error('Failed to connect to browser stream:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnecting(false);
    }
  };

  const disconnectFromBrowserStream = () => {
    if (wsRef.current) {
      // Request streaming to stop
      wsRef.current.send(JSON.stringify({
        type: 'stop-streaming',
        sessionId
      }));
      
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setLastFrame(null);
    setError(null);
  };

  const handleBrowserFrame = (frame: BrowserFrame) => {
    // Update frame rate tracking
    frameCountRef.current++;
    const now = Date.now();
    if (now - lastFrameTimeRef.current >= 1000) {
      console.log(`Browser frame rate: ${frameCountRef.current} FPS`);
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
    }

    // Update the canvas with the new frame
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          // Clear canvas and draw new frame
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = `data:image/jpeg;base64,${frame.data}`;
      }
    }
    
    setLastFrame(frame.data);
  };

  // Auto-connect when panel becomes visible
  useEffect(() => {
    if (isVisible && !isConnected && !isConnecting) {
      connectToBrowserStream();
    }
  }, [isVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromBrowserStream();
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Browser View</CardTitle>
            <CardDescription>
              Live browser automation display
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {isConnected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={disconnectFromBrowserStream}
                className="text-red-600 hover:text-red-700"
              >
                <MonitorX className="w-4 h-4 mr-1" />
                Disconnect
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={connectToBrowserStream}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Monitor className="w-4 h-4 mr-1" />
                )}
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggle(false)}
            >
              ✕
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden shadow-inner border border-gray-200/50">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-600">
              <div className="text-center">
                <MonitorX className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Connection Error</p>
                <p className="text-xs opacity-75">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={connectToBrowserStream}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : !isConnected ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-500">
              <div className="text-center">
                {isConnecting ? (
                  <>
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                    <p className="text-sm">Connecting to browser...</p>
                  </>
                ) : (
                  <>
                    <Monitor className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No browser connection</p>
                    <p className="text-xs opacity-75">Browser display will appear here during automation</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="absolute inset-2 rounded-md overflow-hidden shadow-lg ring-1 ring-black/5">
              <canvas
                ref={canvasRef}
                width={1920}
                height={1080}
                className="w-full h-full object-contain"
                style={{ 
                  imageRendering: 'auto',
                  background: '#ffffff'
                }}
              />
            </div>
          )}
        </div>
        
        {isConnected && (
          <div className="mt-2 text-xs text-gray-500 flex justify-between">
            {/* <span>Session: {sessionId}</span> */}
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
