import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { CanvasArtifact } from '../../lib/canvas/artifacts';

export interface UserPresence {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: { x: number; y: number };
  lastSeen: Date;
  isActive: boolean;
}

export interface CollaborativeSession {
  id: string;
  canvasId: string;
  users: UserPresence[];
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
}

export interface CollaborativeAction {
  id: string;
  userId: string;
  type: 'create' | 'update' | 'delete' | 'move' | 'connect' | 'disconnect';
  artifactId: string;
  data: any;
  timestamp: Date;
  version: number;
}

interface CollaborativeContextType {
  session: CollaborativeSession | null;
  currentUser: UserPresence | null;
  isConnected: boolean;
  joinSession: (canvasId: string, user: Omit<UserPresence, 'lastSeen' | 'isActive'>) => Promise<void>;
  leaveSession: () => Promise<void>;
  sendAction: (action: Omit<CollaborativeAction, 'id' | 'timestamp' | 'version'>) => void;
  onArtifactChange: (callback: (artifact: CanvasArtifact, action: CollaborativeAction) => void) => () => void;
  onUserPresenceChange: (callback: (users: UserPresence[]) => void) => () => void;
  onCursorMove: (position: { x: number; y: number }) => void;
}

const CollaborativeContext = createContext<CollaborativeContextType | null>(null);

interface CollaborativeProviderProps {
  children: ReactNode;
  websocketUrl?: string;
}

// Mock WebSocket implementation for demonstration
class MockWebSocket {
  private listeners: { [event: string]: Function[] } = {};
  private session: CollaborativeSession | null = null;
  private users: UserPresence[] = [];
  private actions: CollaborativeAction[] = [];
  private version = 0;

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  joinSession(canvasId: string, user: UserPresence) {
    this.session = {
      id: `session-${canvasId}`,
      canvasId,
      users: [user],
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    this.users = [user];
    this.emit('session-joined', this.session);
  }

  leaveSession() {
    this.session = null;
    this.users = [];
    this.emit('session-left');
  }

  sendAction(action: CollaborativeAction) {
    action.version = ++this.version;
    this.actions.push(action);
    this.emit('action-received', action);
  }

  updateCursor(userId: string, position: { x: number; y: number }) {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      this.users[userIndex] = {
        ...this.users[userIndex],
        cursor: position,
        lastSeen: new Date(),
        isActive: true,
      };
      this.emit('presence-updated', this.users);
    }
  }
}

const mockWebSocket = new MockWebSocket();

export function CollaborativeProvider({ children, websocketUrl }: CollaborativeProviderProps) {
  const [session, setSession] = useState<CollaborativeSession | null>(null);
  const [currentUser, setCurrentUser] = useState<UserPresence | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [artifactChangeCallbacks, setArtifactChangeCallbacks] = useState<((artifact: CanvasArtifact, action: CollaborativeAction) => void)[]>([]);
  const [userPresenceCallbacks, setUserPresenceCallbacks] = useState<((users: UserPresence[]) => void)[]>([]);

  useEffect(() => {
    // Initialize WebSocket connection
    setIsConnected(true);

    const handleSessionJoined = (newSession: CollaborativeSession) => {
      setSession(newSession);
    };

    const handleSessionLeft = () => {
      setSession(null);
      setCurrentUser(null);
    };

    const handleActionReceived = (action: CollaborativeAction) => {
      // Notify artifact change listeners
      artifactChangeCallbacks.forEach(callback => {
        // In a real implementation, you'd fetch the updated artifact
        // For now, we'll just pass the action
        callback({} as CanvasArtifact, action);
      });
    };

    const handlePresenceUpdated = (users: UserPresence[]) => {
      userPresenceCallbacks.forEach(callback => callback(users));
    };

    mockWebSocket.on('session-joined', handleSessionJoined);
    mockWebSocket.on('session-left', handleSessionLeft);
    mockWebSocket.on('action-received', handleActionReceived);
    mockWebSocket.on('presence-updated', handlePresenceUpdated);

    return () => {
      mockWebSocket.off('session-joined', handleSessionJoined);
      mockWebSocket.off('session-left', handleSessionLeft);
      mockWebSocket.off('action-received', handleActionReceived);
      mockWebSocket.off('presence-updated', handlePresenceUpdated);
    };
  }, [artifactChangeCallbacks, userPresenceCallbacks]);

  const joinSession = useCallback(async (canvasId: string, user: Omit<UserPresence, 'lastSeen' | 'isActive'>) => {
    const userPresence: UserPresence = {
      ...user,
      lastSeen: new Date(),
      isActive: true,
    };

    setCurrentUser(userPresence);
    mockWebSocket.joinSession(canvasId, userPresence);
  }, []);

  const leaveSession = useCallback(async () => {
    mockWebSocket.leaveSession();
  }, []);

  const sendAction = useCallback((action: Omit<CollaborativeAction, 'id' | 'timestamp' | 'version'>) => {
    const fullAction: CollaborativeAction = {
      ...action,
      id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date(),
      version: 0, // Will be set by the WebSocket handler
    };

    mockWebSocket.sendAction(fullAction);
  }, []);

  const onArtifactChange = useCallback((callback: (artifact: CanvasArtifact, action: CollaborativeAction) => void) => {
    setArtifactChangeCallbacks(prev => [...prev, callback]);
    return () => {
      setArtifactChangeCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  const onUserPresenceChange = useCallback((callback: (users: UserPresence[]) => void) => {
    setUserPresenceCallbacks(prev => [...prev, callback]);
    return () => {
      setUserPresenceCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  const onCursorMove = useCallback((position: { x: number; y: number }) => {
    if (currentUser) {
      mockWebSocket.updateCursor(currentUser.id, position);
    }
  }, [currentUser]);

  const value: CollaborativeContextType = {
    session,
    currentUser,
    isConnected,
    joinSession,
    leaveSession,
    sendAction,
    onArtifactChange,
    onUserPresenceChange,
    onCursorMove,
  };

  return (
    <CollaborativeContext.Provider value={value}>
      {children}
    </CollaborativeContext.Provider>
  );
}

export function useCollaborative(): CollaborativeContextType {
  const context = useContext(CollaborativeContext);
  if (!context) {
    throw new Error('useCollaborative must be used within a CollaborativeProvider');
  }
  return context;
}

// Hook for collaborative artifact editing
export function useCollaborativeArtifact(artifactId: string) {
  const { sendAction, onArtifactChange } = useCollaborative();
  const [isLocked, setIsLocked] = useState(false);
  const [lockHolder, setLockHolder] = useState<UserPresence | null>(null);

  useEffect(() => {
    const unsubscribe = onArtifactChange((artifact, action) => {
      if (action.artifactId === artifactId) {
        // Handle different action types
        switch (action.type) {
          case 'update':
            // Handle artifact update
            break;
          case 'delete':
            // Handle artifact deletion
            break;
        }
      }
    });

    return unsubscribe;
  }, [artifactId, onArtifactChange]);

  const updateArtifact = useCallback((updates: Partial<CanvasArtifact>) => {
    sendAction({
      userId: 'current-user', // In real implementation, get from auth
      type: 'update',
      artifactId,
      data: updates,
    });
  }, [sendAction, artifactId]);

  const deleteArtifact = useCallback(() => {
    sendAction({
      userId: 'current-user',
      type: 'delete',
      artifactId,
      data: null,
    });
  }, [sendAction, artifactId]);

  return {
    updateArtifact,
    deleteArtifact,
    isLocked,
    lockHolder,
  };
}

// Component for displaying user presence
export function UserPresenceIndicator({ users }: { users: UserPresence[] }) {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
      {users.map(user => (
        <div
          key={user.id}
          className="flex items-center gap-2 bg-white rounded-lg shadow-lg p-2 border"
          style={{ borderColor: user.color }}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: user.color }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium">{user.name}</span>
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: user.isActive ? '#10b981' : '#6b7280' }}
          />
        </div>
      ))}
    </div>
  );
}

// Component for displaying user cursors
export function UserCursors({ users }: { users: UserPresence[] }) {
  return (
    <>
      {users
        .filter(user => user.cursor && user.isActive)
        .map(user => (
          <div
            key={`cursor-${user.id}`}
            className="absolute pointer-events-none z-40"
            style={{
              left: user.cursor ? user.cursor.x : 0,
              top: user.cursor ? user.cursor.y : 0,
              transform: 'translate(-2px, -2px)',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 2l16 8-16 8V2z"
                fill={user.color}
                stroke="white"
                strokeWidth="2"
              />
            </svg>
            <div
              className="absolute top-5 left-2 px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        ))}
    </>
  );
}</content>
<parameter name="filePath">c:\Users\fjuni\ai-ysh\apps\web\components\canvas\CollaborativeContext.tsx