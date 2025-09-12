'use client';

import { Camera, Loader2, Monitor, MonitorX, RefreshCwIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

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
  const [controlMode, setControlMode] = useState<'agent' | 'user'>('agent');
  const [isFocused, setIsFocused] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(Date.now());
  const lastMoveEventRef = useRef<number>(0);

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
              
            case 'control-mode-changed':
              const newMode = message.data?.mode || 'agent';
              setControlMode(newMode);
              setIsFocused(newMode === 'agent' ? false : isFocused);
              toast.success(`Control switched to ${newMode} mode`);
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

  const switchControlMode = (mode: 'agent' | 'user') => {
    if (!wsRef.current) {
      toast.error('Not connected to browser session');
      console.error('Cannot switch control mode - missing WebSocket connection');
      return;
    }

    console.log(`Switching control mode to: ${mode} for session: ${sessionId}`);
    console.log('WebSocket readyState:', wsRef.current.readyState);

    if (wsRef.current.readyState !== WebSocket.OPEN) {
      toast.error('WebSocket connection is not open');
      console.error('WebSocket is not in OPEN state:', wsRef.current.readyState);
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'control-mode',
      sessionId,
      data: { mode }
    }));

    setControlMode(mode);
    if (mode === 'agent') {
      setIsFocused(false);
    }
    
    console.log(`Control mode switch message sent for ${mode}`);
  };

  const sendUserInput = (inputData: any) => {
    if (!wsRef.current || controlMode !== 'user') return;

    wsRef.current.send(JSON.stringify({
      type: 'user-input',
      sessionId,
      data: inputData
    }));
  };

  const handleCanvasInteraction = (event: React.MouseEvent | React.KeyboardEvent | React.WheelEvent) => {
    if (controlMode !== 'user' || !isFocused) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    // Calculate the actual rendered size of the 16:9 video within the canvas element
    const videoAspectRatio = 16 / 9;
    let renderedWidth = rect.width;
    let renderedHeight = rect.height;

    if (rect.width / rect.height > videoAspectRatio) {
      // Letterboxed (empty space on sides)
      renderedWidth = rect.height * videoAspectRatio;
    } else {
      // Pillarboxed (empty space on top/bottom)
      renderedHeight = rect.width / videoAspectRatio;
    }

    // Calculate the offset of the rendered video within the canvas
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;

    // Calculate scaling factors based on the actual rendered size
    const scaleX = canvas.width / renderedWidth;
    const scaleY = canvas.height / renderedHeight;

    // Get the mouse position relative to the canvas
    const mouseX = (event as React.MouseEvent).clientX - rect.left;
    const mouseY = (event as React.MouseEvent).clientY - rect.top;

    // Check if the click is outside the rendered video area
    if (mouseX < offsetX || mouseX > offsetX + renderedWidth || mouseY < offsetY || mouseY > offsetY + renderedHeight) {
      // Click was in the letterboxed/pillarboxed area, so ignore it
      return;
    }

    // Calculate the final coordinates within the browser's viewport
    const finalX = (mouseX - offsetX) * scaleX;
    const finalY = (mouseY - offsetY) * scaleY;

    if (event.type === 'click') {
      const mouseEvent = event as React.MouseEvent;
      const buttonName = mouseEvent.button === 0 ? 'left' : mouseEvent.button === 2 ? 'right' : 'middle';
      
      sendUserInput({
        type: 'click',
        x: finalX,
        y: finalY,
        button: buttonName
      });
    } else if (event.type === 'mousemove') {
      // Throttle mousemove events to avoid overwhelming the connection
      const now = Date.now();
      if (now - lastMoveEventRef.current > 50) { // Send updates every 50ms
        lastMoveEventRef.current = now;
        sendUserInput({
          type: 'mousemove',
          x: finalX,
          y: finalY
        });
      }
    } else if (event.type === 'wheel') {
      const wheelEvent = event as React.WheelEvent;
      sendUserInput({
        type: 'scroll',
        x: finalX,
        y: finalY,
        deltaX: wheelEvent.deltaX,
        deltaY: wheelEvent.deltaY
      });
    }
  };

  const handleKeyboardInput = (event: React.KeyboardEvent) => {
    if (controlMode !== 'user' || !isFocused) return;

    sendUserInput({
      type: event.type === 'keydown' ? 'keydown' : 'keyup',
      key: event.key,
      code: event.code,
      text: event.key.length === 1 ? event.key : undefined
    });
  };

  const takeScreenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error('No browser view available for screenshot');
      return;
    }

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error('Failed to capture screenshot');
        return;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `browser-screenshot-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Screenshot saved!');
    }, 'image/png');
  };

  const refreshBrowserSession = () => {
    // Reset connection state to trigger reconnection
    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
    setLastFrame(null);
    
    // Disconnect current connection if exists
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Reconnect
    if (isVisible) {
      connectToBrowserStream();
    }
  };

  // Auto-connect when panel becomes visible
  useEffect(() => {
    if (isVisible && !isConnected && !isConnecting) {
      connectToBrowserStream();
    }
  }, [isVisible]);

  // Redraw canvas when control mode changes
  useEffect(() => {
    if (lastFrame && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = `data:image/jpeg;base64,${lastFrame}`;
      }
    }
  }, [controlMode, lastFrame]);

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
            <CardTitle className="text-lg flex items-center">
              {isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Take screenshot"
                  onClick={takeScreenshot}
                  title="Take screenshot"
                  className="mr-2"
                >
                  <Camera className="w-4 h-4 mr-1" />
                </Button>
              )}
              {isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Refresh browser session"
                  onClick={refreshBrowserSession}
                  title="Refresh browser session"
                  className="mr-4"
                >
                  <RefreshCwIcon className="w-4 h-4 mr-1" />
                </Button>
              )}
              <span>Browser View</span>
            </CardTitle>
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
        {isConnected && (
          <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b">
            <div className="flex items-center gap-3 text-sm">
              {controlMode === 'user' ? (
                <>
                  <span className="text-blue-600 font-medium">You are controlling the browser</span>
                  <span className="text-xs text-muted-foreground">Click and type to interact</span>
                </>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground">Agent is controlling the browser</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {controlMode === 'agent' ? 'Agent' : 'User'}
              </span>
              <Switch
                checked={controlMode === 'user'}
                onCheckedChange={(checked) => switchControlMode(checked ? 'user' : 'agent')}
              />
            </div>
          </div>
        )}
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
                  onClick={refreshBrowserSession}
                >
                  <RefreshCwIcon className="w-4 h-4 mr-1" />
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
            <div 
              className="absolute inset-6 rounded-md overflow-hidden shadow-lg ring-1 ring-black/5"
              tabIndex={controlMode === 'user' ? 0 : -1}
              onKeyDown={controlMode === 'user' && isFocused ? handleKeyboardInput : undefined}
              onKeyUp={controlMode === 'user' && isFocused ? handleKeyboardInput : undefined}
              onClick={() => {
                if (controlMode === 'user' && !isFocused) {
                  setIsFocused(true);
                  toast.info('Browser view is now active. You can type and click.');
                }
              }}
            >
              {controlMode === 'user' && !isFocused && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white z-10 pointer-events-none">
                  <p className="text-lg font-semibold">Click to activate browser control</p>
                </div>
              )}
              <canvas
                ref={canvasRef}
                width={1920}
                height={1080}
                className={`w-full h-full object-contain bg-white ${controlMode === 'user' ? 'cursor-pointer' : 'cursor-default'}`}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                style={{ 
                  imageRendering: 'auto' // Required for proper canvas scaling
                }}
                onClick={handleCanvasInteraction}
                onMouseMove={controlMode === 'user' && isFocused ? handleCanvasInteraction : undefined}
                onWheel={controlMode === 'user' && isFocused ? handleCanvasInteraction : undefined}
                onContextMenu={(e) => {
                  if (controlMode === 'user' && isFocused) {
                    e.preventDefault(); // Allow right-click handling
                    handleCanvasInteraction(e);
                  }
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
