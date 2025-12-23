/**
 * API Route: Vector Database
 * POST /api/services/vector
 *
 * Actions:
 * - search: Semantic search
 * - insert: Add embedding
 * - batch_insert: Add multiple embeddings
 * - delete: Remove embedding
 * - count: Get embeddings count
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { servicesMesh } from "@/lib/services/servicesMesh";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, params } = body;

    if (!action) {
      return NextResponse.json({ error: "Action required" }, { status: 400 });
    }

    // Execute via services mesh
    const result = await servicesMesh.execute({
      service: "vector",
      action,
      params,
      userId: session.user.id,
      tier: (session.user as any).tier || "free",
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metrics: result.metrics,
    });
  } catch (error: any) {
    console.error("Vector service error:", error);
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
