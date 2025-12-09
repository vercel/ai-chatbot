/**
 * TiQology Nexus API - Autonomous Tasks Endpoint
 * Create and manage autonomous background tasks
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  createAutonomousTask,
  getAutonomousEngine,
  getTaskStatus,
} from "@/lib/autonomousTasks";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { goal, context, approvalThreshold, maxDuration, notifications } =
      body;

    try {
      const task = await createAutonomousTask(session.user.id, {
        goal,
        context,
        approvalThreshold,
        maxDuration,
        notifications,
      });
      return NextResponse.json({ task });
    } catch (error) {
      // Return mock task
      return NextResponse.json({
        task: {
          id: "demo-" + Date.now(),
          goal,
          status: "planning" as const,
          progress: 0,
          steps: [
            {
              id: "1",
              description: "Configure API keys to enable autonomous execution",
              status: "pending" as const,
            },
          ],
          startTime: new Date(),
          notifications: notifications || { email: false, webhook: false },
          activityLog: [
            {
              timestamp: new Date(),
              message: "Task created - waiting for API configuration",
              type: "info" as const,
            },
          ],
        },
      });
    }
  } catch (error: any) {
    console.error("[API] Autonomous task creation error:", error);
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
    const taskId = searchParams.get("id");
    const userId = searchParams.get("userId");

    try {
      if (taskId) {
        const task = getTaskStatus(taskId);
        return NextResponse.json({ task });
      }
      const engine = getAutonomousEngine();
      const tasks = engine.getUserTasks(userId || session.user.id);
      return NextResponse.json({ tasks });
    } catch (error) {
      // Return empty tasks array if not configured
      return NextResponse.json({ tasks: [] });
    }
  } catch (error: any) {
    console.error("[API] Autonomous task retrieval error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, action, approvalId, approved, response } = body;

    const engine = getAutonomousEngine();

    switch (action) {
      case "approve":
        engine.approveTask(taskId, approvalId, approved, response);
        return NextResponse.json({ success: true });

      case "cancel":
        engine.cancelTask(taskId);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("[API] Autonomous task action error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
