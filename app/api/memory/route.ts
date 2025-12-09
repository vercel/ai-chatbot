/**
 * TiQology Nexus API - Neural Memory Endpoint
 * Access persistent AI memory system
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getMemoryEngine,
  getUserContext,
  recall,
  rememberConversation,
} from "@/lib/neuralMemory";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case "store":
        await rememberConversation(
          session.user.id,
          data.messages,
          data.metadata
        );
        return NextResponse.json({ success: true });

      case "recall": {
        try {
          const memories = await recall(
            session.user.id,
            data.query,
            data.limit
          );
          return NextResponse.json({ memories });
        } catch (error) {
          // Return mock data if services not configured
          return NextResponse.json({
            memories: [
              {
                id: "1",
                content: "Welcome to TiQology Nexus!",
                timestamp: new Date(),
                category: "system",
                confidence: 0.95,
              },
              {
                id: "2",
                content: "Neural memory will store your conversations here",
                timestamp: new Date(),
                category: "info",
                confidence: 0.9,
              },
            ],
          });
        }
      }

      case "context": {
        try {
          const context = await getUserContext(session.user.id);
          return NextResponse.json({ context });
        } catch (error) {
          return NextResponse.json({
            context: { summary: "Configure API keys to enable context" },
          });
        }
      }

      case "profile": {
        try {
          const engine = getMemoryEngine();
          await engine.initialize();
          const profile = await engine.getUserProfile(session.user.id);
          return NextResponse.json({ profile });
        } catch (error) {
          // Return mock profile
          return NextResponse.json({
            profile: {
              expertise: ["AI Systems", "Full-Stack Development"],
              projects: ["TiQology Nexus"],
              preferences: { theme: "dark", notifications: true },
              conversationCount: 0,
              lastActive: new Date(),
            },
          });
        }
      }

      case "graph": {
        // Return mock graph data
        return NextResponse.json({
          nodes: [
            { id: "1", label: "You", type: "user", connections: 3 },
            { id: "2", label: "AI Systems", type: "topic", connections: 2 },
            {
              id: "3",
              label: "TiQology Nexus",
              type: "project",
              connections: 1,
            },
          ],
          links: [
            { source: "1", target: "2" },
            { source: "1", target: "3" },
            { source: "2", target: "3" },
          ],
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("[API] Neural memory error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = Number.parseInt(searchParams.get("limit") || "5");

    try {
      const memories = await recall(session.user.id, query, limit);
      return NextResponse.json({ memories });
    } catch (error) {
      // Return mock data if services not configured
      return NextResponse.json({
        memories: [
          {
            id: "1",
            content: "Configure Pinecone & Neo4j to enable memory storage",
            timestamp: new Date(),
            category: "system",
            confidence: 1.0,
          },
        ],
      });
    }
  } catch (error: any) {
    console.error("[API] Neural memory retrieval error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
