/**
 * TiQology Elite Analytics API
 *
 * Real-time analytics and insights for administrators
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getCostAnalytics } from "@/lib/ai/eliteInference";
import { performanceMonitor } from "@/lib/eliteMiddleware";
import { getTiqologyDb } from "@/lib/tiqologyDb";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Admin access required" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "overview";

  const supabase = getTiqologyDb();

  try {
    switch (type) {
      case "overview":
        return await getOverviewAnalytics(supabase);

      case "performance":
        return await getPerformanceAnalytics();

      case "costs":
        return await getCostAnalyticsReport();

      case "users":
        return await getUserAnalytics(supabase);

      case "agents":
        return await getAgentAnalytics(supabase);

      default:
        return NextResponse.json(
          { error: "Bad Request", message: "Invalid analytics type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to generate analytics",
      },
      { status: 500 }
    );
  }
}

async function getOverviewAnalytics(supabase: any) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get user count
  const { count: totalUsers } = await supabase
    .from("tiq_users")
    .select("*", { count: "exact", head: true });

  // Get active subscriptions
  const { count: activeSubscriptions } = await supabase
    .from("tiq_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Get MRR
  const { data: subscriptionData } = await supabase
    .from("tiq_subscriptions")
    .select("plan_id, tiq_plans(price_monthly)")
    .eq("status", "active");

  const mrr =
    subscriptionData?.reduce((sum: number, sub: any) => {
      return sum + (sub.tiq_plans?.price_monthly || 0);
    }, 0) || 0;

  // Get total affiliates
  const { count: totalAffiliates } = await supabase
    .from("tiq_affiliates")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Get total agent tasks (last 30 days)
  const { count: agentTasks } = await supabase
    .from("agentos_event_log")
    .select("*", { count: "exact", head: true })
    .gte("created_at", thirtyDaysAgo.toISOString());

  // Get performance summary
  const perfSummary = performanceMonitor.getSummary();

  // Get cost analytics
  const costAnalytics = getCostAnalytics();

  return NextResponse.json(
    {
      overview: {
        totalUsers,
        activeSubscriptions,
        mrr,
        arr: mrr * 12,
        totalAffiliates,
        agentTasksLast30Days: agentTasks,
      },
      performance: {
        avgResponseTime: perfSummary.avgResponseTime,
        requestsPerMinute: perfSummary.requestsPerMinute,
        errorRate: perfSummary.errorRate,
      },
      costs: {
        totalAICost: costAnalytics.totalCost,
        avgCostPerRequest: costAnalytics.avgCostPerRequest,
      },
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

async function getPerformanceAnalytics() {
  const perfSummary = performanceMonitor.getSummary();

  return NextResponse.json(
    {
      performance: {
        totalRequests: perfSummary.totalRequests,
        requestsPerMinute: perfSummary.requestsPerMinute,
        avgResponseTime: `${perfSummary.avgResponseTime.toFixed(2)}ms`,
        p95ResponseTime: `${perfSummary.p95ResponseTime.toFixed(2)}ms`,
        errorRate: `${perfSummary.errorRate.toFixed(2)}%`,
      },
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

async function getCostAnalyticsReport() {
  const costAnalytics = getCostAnalytics();

  return NextResponse.json(
    {
      costs: {
        total: costAnalytics.totalCost,
        byModel: costAnalytics.costByModel,
        avgPerRequest: costAnalytics.avgCostPerRequest,
        totalRequests: costAnalytics.totalRequests,
      },
      projections: {
        daily:
          costAnalytics.avgCostPerRequest *
          performanceMonitor.getSummary().requestsPerMinute *
          60 *
          24,
        monthly:
          costAnalytics.avgCostPerRequest *
          performanceMonitor.getSummary().requestsPerMinute *
          60 *
          24 *
          30,
        yearly:
          costAnalytics.avgCostPerRequest *
          performanceMonitor.getSummary().requestsPerMinute *
          60 *
          24 *
          365,
      },
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

async function getUserAnalytics(supabase: any) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get user growth
  const { data: newUsers } = await supabase
    .from("tiq_users")
    .select("created_at")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  // Group by day
  const usersByDay: Record<string, number> = {};

  newUsers?.forEach((user: any) => {
    const day = new Date(user.created_at).toISOString().split("T")[0];
    usersByDay[day] = (usersByDay[day] || 0) + 1;
  });

  // Get users by role
  const { data: usersByRole } = await supabase
    .from("tiq_users")
    .select("role")
    .order("role");

  const roleDistribution: Record<string, number> = {};

  usersByRole?.forEach((user: any) => {
    roleDistribution[user.role] = (roleDistribution[user.role] || 0) + 1;
  });

  return NextResponse.json(
    {
      growth: {
        last30Days: newUsers?.length || 0,
        byDay: usersByDay,
      },
      distribution: {
        byRole: roleDistribution,
      },
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

async function getAgentAnalytics(supabase: any) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get agent activity
  const { data: agentEvents } = await supabase
    .from("agentos_event_log")
    .select("agent_id, event_type, status, created_at")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  // Group by agent
  const byAgent: Record<
    string,
    { total: number; successful: number; failed: number }
  > = {};

  agentEvents?.forEach((event: any) => {
    if (!byAgent[event.agent_id]) {
      byAgent[event.agent_id] = { total: 0, successful: 0, failed: 0 };
    }

    byAgent[event.agent_id].total++;

    if (event.status === "completed") {
      byAgent[event.agent_id].successful++;
    } else if (event.status === "failed") {
      byAgent[event.agent_id].failed++;
    }
  });

  // Calculate success rates
  const agentStats = Object.entries(byAgent).map(([agentId, stats]) => ({
    agentId,
    ...stats,
    successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
  }));

  return NextResponse.json(
    {
      agents: agentStats,
      summary: {
        totalTasks: agentEvents?.length || 0,
        uniqueAgents: Object.keys(byAgent).length,
      },
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
