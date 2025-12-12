/**
 * TiQology Elite Health Check Endpoint
 *
 * Provides comprehensive system health monitoring
 */

import { NextResponse } from "next/server";
import { getSystemHealth, performanceMonitor } from "@/lib/eliteMiddleware";
import { getTiqologyDb } from "@/lib/tiqologyDb";

export async function GET() {
  const startTime = Date.now();

  // Check database connectivity
  let dbHealthy = false;
  let dbLatency = 0;

  try {
    const dbStart = Date.now();
    const supabase = getTiqologyDb();
    const { error } = await supabase.from("tiq_users").select("id").limit(1);
    dbLatency = Date.now() - dbStart;
    dbHealthy = !error;
  } catch (err) {
    dbHealthy = false;
  }

  // Get system health
  const systemHealth = getSystemHealth();

  // Get performance summary
  const perfSummary = performanceMonitor.getSummary();

  // Calculate overall health
  const overallHealthy = dbHealthy && systemHealth.status === "healthy";
  const statusCode = overallHealthy ? 200 : dbHealthy ? 503 : 500;

  const response = {
    status: overallHealthy ? "healthy" : systemHealth.status,
    timestamp: new Date().toISOString(),
    version: "1.5.0-elite",

    services: {
      database: {
        status: dbHealthy ? "healthy" : "unhealthy",
        latency: `${dbLatency}ms`,
      },
      api: {
        status: "healthy",
        latency: `${Date.now() - startTime}ms`,
      },
      cache: {
        status: "healthy",
        size: systemHealth.metrics.cache.size,
        maxSize: systemHealth.metrics.cache.maxSize,
        utilization: `${((systemHealth.metrics.cache.size / systemHealth.metrics.cache.maxSize) * 100).toFixed(2)}%`,
      },
    },

    performance: {
      totalRequests: perfSummary.totalRequests,
      requestsPerMinute: perfSummary.requestsPerMinute,
      avgResponseTime: `${perfSummary.avgResponseTime.toFixed(2)}ms`,
      p95ResponseTime: `${perfSummary.p95ResponseTime.toFixed(2)}ms`,
      errorRate: `${perfSummary.errorRate.toFixed(2)}%`,
    },

    metadata: {
      agent: "TiQology AgentOS v1.5",
      deployment: process.env.VERCEL_ENV || "development",
      region: process.env.VERCEL_REGION || "unknown",
    },
  };

  return NextResponse.json(response, { status: statusCode });
}
