/**
 * API Route: Services Mesh Health Check
 * GET /api/services/health
 */

import { type NextRequest, NextResponse } from "next/server";
import { servicesMesh } from "@/lib/services/servicesMesh";

export async function GET(request: NextRequest) {
  try {
    const health = await servicesMesh.healthCheck();

    const allHealthy = Object.values(health).every((status) => status === true);

    return NextResponse.json(
      {
        status: allHealthy ? "healthy" : "degraded",
        services: health,
        timestamp: new Date().toISOString(),
      },
      {
        status: allHealthy ? 200 : 503,
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
