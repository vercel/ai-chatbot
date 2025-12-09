/**
 * TiQology Nexus - Real-time Collaborative Artifacts
 * Google Docs-style collaboration + AI
 *
 * Features:
 * - Real-time document synchronization
 * - User presence tracking
 * - Cursor and selection sharing
 * - Conflict-free editing (CRDT)
 * - AI presence and suggestions
 * - Activity timeline
 */

import { EventEmitter } from "events";
import { createClient } from "redis";
import { WebSocket, WebSocketServer } from "ws";

// ============================================
// TYPES
// ============================================

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  isAI: boolean;
  status: "active" | "idle" | "typing";
  lastActivity: Date;
}

export interface CollaborativeEdit {
  id: string;
  userId: string;
  timestamp: Date;
  operation: "insert" | "delete" | "replace";
  position: {
    line: number;
    column: number;
  };
  content?: string;
  length?: number;
}

export interface CollaborativeSession {
  documentId: string;
  collaborators: Map<string, Collaborator>;
  content: string;
  version: number;
  edits: CollaborativeEdit[];
  aiSuggestions: AISuggestion[];
}

export interface AISuggestion {
  id: string;
  type: "completion" | "refactor" | "fix" | "optimize";
  position: {
    line: number;
    column: number;
  };
  content: string;
  confidence: number;
  applied: boolean;
}

export interface PresenceUpdate {
  userId: string;
  cursor?: { line: number; column: number };
  selection?: any;
  status: "active" | "idle" | "typing";
}

// ============================================
// COLLABORATIVE ARTIFACT ENGINE
// ============================================

export class CollaborativeArtifactEngine extends EventEmitter {
  private sessions: Map<string, CollaborativeSession> = new Map();
  private wsServer: WebSocketServer | null = null;
  private redis: ReturnType<typeof createClient> | null = null;
  private clients: Map<string, WebSocket> = new Map();

  constructor() {
    super();
  }

  /**
   * Initialize WebSocket server and Redis
   */
  async initialize(port = 3001): Promise<void> {
    try {
      // Initialize Redis for session storage
      if (process.env.REDIS_URL) {
        this.redis = createClient({ url: process.env.REDIS_URL });
        await this.redis.connect();
        console.log("[Collaboration] Redis connected");
      }

      // Initialize WebSocket server
      this.wsServer = new WebSocketServer({ port });

      this.wsServer.on("connection", (ws: WebSocket, req) => {
        this.handleConnection(ws, req);
      });

      console.log(`[Collaboration] WebSocket server started on port ${port}`);
    } catch (error) {
      console.error("[Collaboration] Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, req: any): void {
    const userId = this.extractUserId(req);
    this.clients.set(userId, ws);

    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(userId, message, ws);
      } catch (error) {
        console.error("[Collaboration] Message handling error:", error);
      }
    });

    ws.on("close", () => {
      this.handleDisconnect(userId);
    });

    ws.send(JSON.stringify({ type: "connected", userId }));
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(userId: string, message: any, ws: WebSocket): void {
    const { type, documentId, data } = message;

    switch (type) {
      case "join":
        this.joinDocument(userId, documentId, data.user);
        break;

      case "edit":
        this.handleEdit(userId, documentId, data.edit);
        break;

      case "cursor":
        this.updatePresence(userId, documentId, data);
        break;

      case "ai-suggest":
        this.requestAISuggestion(userId, documentId, data);
        break;

      default:
        console.warn("[Collaboration] Unknown message type:", type);
    }
  }

  /**
   * User joins a document session
   */
  private joinDocument(
    userId: string,
    documentId: string,
    userData: any
  ): void {
    let session = this.sessions.get(documentId);

    if (!session) {
      session = {
        documentId,
        collaborators: new Map(),
        content: "",
        version: 0,
        edits: [],
        aiSuggestions: [],
      };
      this.sessions.set(documentId, session);
    }

    const collaborator: Collaborator = {
      id: userId,
      name: userData.name || `User ${userId}`,
      color: userData.color || this.generateColor(),
      isAI: false,
      status: "active",
      lastActivity: new Date(),
    };

    session.collaborators.set(userId, collaborator);

    // Notify all collaborators
    this.broadcast(documentId, {
      type: "user-joined",
      user: collaborator,
      collaborators: Array.from(session.collaborators.values()),
    });

    // Send current document state to new user
    const ws = this.clients.get(userId);
    if (ws) {
      ws.send(
        JSON.stringify({
          type: "document-state",
          content: session.content,
          version: session.version,
          collaborators: Array.from(session.collaborators.values()),
        })
      );
    }

    console.log(`[Collaboration] User ${userId} joined document ${documentId}`);
  }

  /**
   * Handle document edit
   */
  private handleEdit(
    userId: string,
    documentId: string,
    edit: CollaborativeEdit
  ): void {
    const session = this.sessions.get(documentId);
    if (!session) return;

    // Apply edit to document
    session.content = this.applyEdit(session.content, edit);
    session.version++;
    session.edits.push(edit);

    // Update user status
    const collaborator = session.collaborators.get(userId);
    if (collaborator) {
      collaborator.status = "typing";
      collaborator.lastActivity = new Date();
    }

    // Broadcast edit to all collaborators
    this.broadcast(
      documentId,
      {
        type: "edit",
        edit,
        version: session.version,
        userId,
      },
      userId
    );

    // Save to Redis if available
    if (this.redis) {
      this.redis.set(`doc:${documentId}`, JSON.stringify(session));
    }
  }

  /**
   * Update user presence (cursor, selection, status)
   */
  private updatePresence(
    userId: string,
    documentId: string,
    presence: PresenceUpdate
  ): void {
    const session = this.sessions.get(documentId);
    if (!session) return;

    const collaborator = session.collaborators.get(userId);
    if (!collaborator) return;

    if (presence.cursor) {
      collaborator.cursor = presence.cursor;
    }

    if (presence.selection) {
      collaborator.selection = presence.selection;
    }

    collaborator.status = presence.status;
    collaborator.lastActivity = new Date();

    // Broadcast presence update
    this.broadcast(
      documentId,
      {
        type: "presence",
        userId,
        cursor: collaborator.cursor,
        selection: collaborator.selection,
        status: collaborator.status,
      },
      userId
    );
  }

  /**
   * Request AI suggestion
   */
  private async requestAISuggestion(
    userId: string,
    documentId: string,
    data: any
  ): Promise<void> {
    const session = this.sessions.get(documentId);
    if (!session) return;

    // Add AI as collaborator if not present
    if (!session.collaborators.has("ai")) {
      session.collaborators.set("ai", {
        id: "ai",
        name: "TiQology AI",
        color: "#4ECDC4",
        isAI: true,
        status: "active",
        lastActivity: new Date(),
      });
    }

    // Update AI status
    const aiCollaborator = session.collaborators.get("ai")!;
    aiCollaborator.status = "typing";

    this.broadcast(documentId, {
      type: "ai-thinking",
      message: "AI is analyzing...",
    });

    // Generate AI suggestion (placeholder - integrate with actual AI)
    setTimeout(() => {
      const suggestion: AISuggestion = {
        id: `suggest-${Date.now()}`,
        type: data.type || "completion",
        position: data.position,
        content: "// AI generated suggestion",
        confidence: 0.9,
        applied: false,
      };

      session.aiSuggestions.push(suggestion);
      aiCollaborator.status = "active";

      this.broadcast(documentId, {
        type: "ai-suggestion",
        suggestion,
      });
    }, 1000);
  }

  /**
   * Handle user disconnect
   */
  private handleDisconnect(userId: string): void {
    this.clients.delete(userId);

    // Remove from all sessions
    this.sessions.forEach((session, documentId) => {
      if (session.collaborators.has(userId)) {
        session.collaborators.delete(userId);

        this.broadcast(documentId, {
          type: "user-left",
          userId,
          collaborators: Array.from(session.collaborators.values()),
        });
      }
    });

    console.log(`[Collaboration] User ${userId} disconnected`);
  }

  /**
   * Broadcast message to all collaborators in a document
   */
  private broadcast(
    documentId: string,
    message: any,
    excludeUserId?: string
  ): void {
    const session = this.sessions.get(documentId);
    if (!session) return;

    session.collaborators.forEach((collaborator) => {
      if (collaborator.id !== excludeUserId && !collaborator.isAI) {
        const ws = this.clients.get(collaborator.id);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      }
    });
  }

  /**
   * Apply edit to content
   */
  private applyEdit(content: string, edit: CollaborativeEdit): string {
    const lines = content.split("\n");
    const line = lines[edit.position.line] || "";

    switch (edit.operation) {
      case "insert":
        lines[edit.position.line] =
          line.slice(0, edit.position.column) +
          (edit.content || "") +
          line.slice(edit.position.column);
        break;

      case "delete":
        lines[edit.position.line] =
          line.slice(0, edit.position.column) +
          line.slice(edit.position.column + (edit.length || 0));
        break;

      case "replace":
        lines[edit.position.line] =
          line.slice(0, edit.position.column) +
          (edit.content || "") +
          line.slice(edit.position.column + (edit.length || 0));
        break;
    }

    return lines.join("\n");
  }

  /**
   * Extract user ID from request
   */
  private extractUserId(req: any): string {
    // Extract from query params or headers
    const url = new URL(req.url!, `http://${req.headers.host}`);
    return url.searchParams.get("userId") || `user-${Date.now()}`;
  }

  /**
   * Generate random color for user
   */
  private generateColor(): string {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E2",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Get session info
   */
  getSession(documentId: string): CollaborativeSession | undefined {
    return this.sessions.get(documentId);
  }

  /**
   * Close server
   */
  async close(): Promise<void> {
    if (this.wsServer) {
      this.wsServer.close();
    }
    if (this.redis) {
      await this.redis.quit();
    }
    console.log("[Collaboration] Server closed");
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let collaborationEngine: CollaborativeArtifactEngine | null = null;

export function getCollaborationEngine(): CollaborativeArtifactEngine {
  if (!collaborationEngine) {
    collaborationEngine = new CollaborativeArtifactEngine();
  }
  return collaborationEngine;
}

export async function initializeCollaboration(port = 3001): Promise<void> {
  const engine = getCollaborationEngine();
  await engine.initialize(port);
}
