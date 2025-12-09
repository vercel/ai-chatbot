/**
 * TiQology Nexus API - Agent Swarm Endpoint
 * Deploy AI agent teams
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { deploySwarm, getSwarmStatus } from "@/lib/agentSwarm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { goal, context, constraints, preferences } = body;

    try {
      const result = await deploySwarm({
        goal,
        context,
        constraints,
        preferences,
      });
      return NextResponse.json({ result });
    } catch (error) {
      // Return mock swarm status
      return NextResponse.json({
        swarmId: "demo-" + Date.now(),
        goal,
        agents: [
          {
            id: "1",
            role: "architect" as const,
            status: "idle" as const,
            progress: 0,
            model: "GPT-4",
          },
          {
            id: "2",
            role: "coder" as const,
            status: "idle" as const,
            progress: 0,
            model: "GPT-4",
          },
        ],
        tasks: [
          {
            id: "1",
            description: "Configure API keys to deploy swarms",
            status: "pending" as const,
            dependencies: [],
          },
        ],
        overallProgress: 0,
        startTime: new Date(),
        metrics: {
          parallelism: 0,
          efficiency: 0,
          tasksCompleted: 0,
          tasksTotal: 1,
        },
      });
    }
  } catch (error: any) {
    console.error("[API] Agent swarm error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = getSwarmStatus();

    return NextResponse.json({ status });
  } catch (error: any) {
    console.error("[API] Agent swarm status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
