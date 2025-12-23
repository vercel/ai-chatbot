/**
 * TiQology Neural Mesh Layer
 *
 * Real-time coordination layer enabling all AI services to share context,
 * memory, and state across the entire system. Creates a "nervous system"
 * for distributed AI components.
 *
 * Features:
 * - WebSocket-based real-time communication
 * - Redis Streams for event propagation
 * - Shared context and memory synchronization
 * - Service-to-service coordination
 * - Event-driven architecture
 */

import { EventEmitter } from "events";
import Redis from "ioredis";
import { WebSocket, WebSocketServer } from "ws";

// Neural Mesh Event Types
type NeuralEvent =
  | "context:update"
  | "memory:sync"
  | "inference:complete"
  | "voice:generated"
  | "video:rendered"
  | "vector:indexed"
  | "agent:message"
  | "system:health";

interface NeuralMessage {
  event: NeuralEvent;
  source: string;
  target?: string; // Optional - broadcast if not specified
  payload: any;
  timestamp: number;
  correlationId?: string;
}

interface ServiceNode {
  id: string;
  type: "voice" | "video" | "inference" | "vector" | "agent" | "web";
  status: "online" | "offline" | "busy";
  lastHeartbeat: number;
  metadata: Record<string, any>;
}

class NeuralMeshLayer extends EventEmitter {
  private redis: Redis;
  private redisSub: Redis;
  private wss: WebSocketServer | null = null;
  private nodes: Map<string, ServiceNode> = new Map();
  private connections: Map<string, WebSocket> = new Map();
  private readonly STREAM_KEY = "tiqology:neural:stream";
  private readonly HEARTBEAT_INTERVAL = 30_000; // 30 seconds
  private readonly NODE_TIMEOUT = 60_000; // 60 seconds

  constructor() {
    super();

    // Redis for pub/sub and streams
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: Number.parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
    });

    // Separate Redis connection for subscriptions
    this.redisSub = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: Number.parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
    });

    this.initialize();
  }

  private async initialize() {
    // Start consuming from Redis Stream
    this.startStreamConsumer();

    // Start heartbeat monitor
    this.startHeartbeatMonitor();

    // Clean up stale nodes on startup
    this.cleanupStaleNodes();
  }

  /**
   * Start WebSocket server for real-time communication
   */
  startWebSocketServer(port = 8080) {
    this.wss = new WebSocketServer({ port });

    this.wss.on("connection", (ws: WebSocket, req) => {
      const nodeId = req.url?.split("nodeId=")[1] || `node-${Date.now()}`;

      console.log(`[Neural Mesh] Node connected: ${nodeId}`);
      this.connections.set(nodeId, ws);

      // Handle incoming messages
      ws.on("message", async (data: Buffer) => {
        try {
          const message: NeuralMessage = JSON.parse(data.toString());
          await this.routeMessage(message);
        } catch (error) {
          console.error("[Neural Mesh] Message parsing error:", error);
        }
      });

      // Handle disconnection
      ws.on("close", () => {
        console.log(`[Neural Mesh] Node disconnected: ${nodeId}`);
        this.connections.delete(nodeId);
        this.updateNodeStatus(nodeId, "offline");
      });

      // Handle errors
      ws.on("error", (error) => {
        console.error(`[Neural Mesh] WebSocket error for ${nodeId}:`, error);
      });
    });

    console.log(`[Neural Mesh] WebSocket server started on port ${port}`);
  }

  /**
   * Register a service node in the mesh
   */
  async registerNode(node: ServiceNode): Promise<void> {
    this.nodes.set(node.id, {
      ...node,
      status: "online",
      lastHeartbeat: Date.now(),
    });

    // Publish registration event
    await this.publish({
      event: "system:health",
      source: "neural-mesh",
      payload: {
        action: "node_registered",
        node: node.id,
        type: node.type,
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Update node status
   */
  updateNodeStatus(nodeId: string, status: ServiceNode["status"]): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.status = status;
      node.lastHeartbeat = Date.now();
    }
  }

  /**
   * Send heartbeat for a node
   */
  async heartbeat(nodeId: string): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.lastHeartbeat = Date.now();
      node.status = "online";
    }
  }

  /**
   * Publish message to Neural Mesh
   */
  async publish(message: NeuralMessage): Promise<void> {
    // Add to Redis Stream for durability
    await this.redis.xadd(
      this.STREAM_KEY,
      "*",
      "data",
      JSON.stringify(message)
    );

    // Route to WebSocket connections for real-time delivery
    await this.routeMessage(message);

    // Emit local event
    this.emit("message", message);
  }

  /**
   * Route message to appropriate destination(s)
   */
  private async routeMessage(message: NeuralMessage): Promise<void> {
    if (message.target) {
      // Direct message to specific node
      const ws = this.connections.get(message.target);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    } else {
      // Broadcast to all connected nodes
      this.connections.forEach((ws, nodeId) => {
        if (ws.readyState === WebSocket.OPEN && nodeId !== message.source) {
          ws.send(JSON.stringify(message));
        }
      });
    }
  }

  /**
   * Start consuming messages from Redis Stream
   */
  private async startStreamConsumer() {
    let lastId = "0";

    const consumeLoop = async () => {
      try {
        const result = await this.redis.xread(
          "BLOCK",
          5000,
          "STREAMS",
          this.STREAM_KEY,
          lastId
        );

        if (result) {
          for (const [stream, messages] of result) {
            for (const [id, fields] of messages) {
              lastId = id;
              const data = fields[1]; // fields is ['data', '<json>']
              const message: NeuralMessage = JSON.parse(data);

              // Process message
              this.emit("message", message);
              await this.routeMessage(message);
            }
          }
        }
      } catch (error) {
        console.error("[Neural Mesh] Stream consumer error:", error);
      }

      // Continue consuming
      setImmediate(consumeLoop);
    };

    consumeLoop();
  }

  /**
   * Monitor node heartbeats and mark stale nodes offline
   */
  private startHeartbeatMonitor() {
    setInterval(() => {
      const now = Date.now();

      this.nodes.forEach((node, nodeId) => {
        if (now - node.lastHeartbeat > this.NODE_TIMEOUT) {
          console.log(`[Neural Mesh] Node timeout: ${nodeId}`);
          node.status = "offline";
        }
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Clean up stale nodes
   */
  private cleanupStaleNodes() {
    const now = Date.now();
    const staleNodes: string[] = [];

    this.nodes.forEach((node, nodeId) => {
      if (now - node.lastHeartbeat > this.NODE_TIMEOUT * 2) {
        staleNodes.push(nodeId);
      }
    });

    staleNodes.forEach((nodeId) => this.nodes.delete(nodeId));

    if (staleNodes.length > 0) {
      console.log(`[Neural Mesh] Cleaned up ${staleNodes.length} stale nodes`);
    }
  }

  /**
   * Get all active nodes
   */
  getActiveNodes(): ServiceNode[] {
    return Array.from(this.nodes.values()).filter(
      (node) => node.status === "online"
    );
  }

  /**
   * Get nodes by type
   */
  getNodesByType(type: ServiceNode["type"]): ServiceNode[] {
    return Array.from(this.nodes.values()).filter(
      (node) => node.type === type && node.status === "online"
    );
  }

  /**
   * Synchronize context across all inference nodes
   */
  async syncContext(context: any, correlationId?: string): Promise<void> {
    await this.publish({
      event: "context:update",
      source: "neural-mesh",
      payload: context,
      timestamp: Date.now(),
      correlationId,
    });
  }

  /**
   * Synchronize memory/embeddings across vector stores
   */
  async syncMemory(embeddings: any[], correlationId?: string): Promise<void> {
    await this.publish({
      event: "memory:sync",
      source: "neural-mesh",
      payload: { embeddings },
      timestamp: Date.now(),
      correlationId,
    });
  }

  /**
   * Get mesh health status
   */
  getHealthStatus() {
    const nodes = Array.from(this.nodes.values());
    const activeCount = nodes.filter((n) => n.status === "online").length;

    return {
      totalNodes: nodes.length,
      activeNodes: activeCount,
      offlineNodes: nodes.length - activeCount,
      nodesByType: {
        voice: nodes.filter((n) => n.type === "voice").length,
        video: nodes.filter((n) => n.type === "video").length,
        inference: nodes.filter((n) => n.type === "inference").length,
        vector: nodes.filter((n) => n.type === "vector").length,
        agent: nodes.filter((n) => n.type === "agent").length,
        web: nodes.filter((n) => n.type === "web").length,
      },
      connections: this.connections.size,
      timestamp: Date.now(),
    };
  }

  /**
   * Shutdown the Neural Mesh
   */
  async shutdown(): Promise<void> {
    console.log("[Neural Mesh] Shutting down...");

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }

    // Close Redis connections
    await this.redis.quit();
    await this.redisSub.quit();

    // Clear all data
    this.nodes.clear();
    this.connections.clear();

    console.log("[Neural Mesh] Shutdown complete");
  }
}

// Singleton instance
export const neuralMesh = new NeuralMeshLayer();

// Export types
export type { NeuralMessage, ServiceNode, NeuralEvent };
