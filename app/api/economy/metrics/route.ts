/**
 * TiQology Human Economy - Metrics & Analytics API
 * Provides real-time economy metrics and financial telemetry
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getTiqologyDb } from "@/lib/tiqologyDb";

// GET /api/economy/metrics - Get real-time economy metrics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const periodDays = Number.parseInt(searchParams.get("period_days") || "30");

    const supabase = getTiqologyDb();

    // Get real-time economy overview
    if (type === "overview" || !type) {
      const { data, error } = await supabase.rpc(
        "get_economy_realtime_metrics"
      );

      if (error) {
        throw new Error(`Failed to get metrics: ${error.message}`);
      }

      return NextResponse.json(data);
    }

    // Get user financial profile
    if (type === "user_profile") {
      const { data, error } = await supabase.rpc("get_user_financial_profile", {
        p_user_id: session.user.id,
      });

      if (error) {
        throw new Error(`Failed to get user profile: ${error.message}`);
      }

      return NextResponse.json(data);
    }

    // Get affiliate performance report
    if (type === "affiliate_performance") {
      // Get user's affiliate ID
      const { data: affiliate } = await supabase
        .from("tiq_affiliates")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!affiliate) {
        return NextResponse.json(
          { error: "User is not an affiliate" },
          { status: 404 }
        );
      }

      const { data, error } = await supabase.rpc(
        "get_affiliate_performance_report",
        {
          p_affiliate_id: affiliate.id,
          p_period_days: periodDays,
        }
      );

      if (error) {
        throw new Error(`Failed to get affiliate report: ${error.message}`);
      }

      return NextResponse.json(data);
    }

    // Get subscription analytics (admin only)
    if (type === "subscription_analytics") {
      // TODO: Add admin role check
      const { data, error } = await supabase.rpc("get_subscription_analytics", {
        p_period_days: periodDays,
      });

      if (error) {
        throw new Error(
          `Failed to get subscription analytics: ${error.message}`
        );
      }

      return NextResponse.json(data);
    }

    // Get user LTV
    if (type === "user_ltv") {
      const { data, error } = await supabase.rpc("calculate_user_ltv", {
        p_user_id: session.user.id,
      });

      if (error) {
        throw new Error(`Failed to calculate LTV: ${error.message}`);
      }

      return NextResponse.json({ ltv: data });
    }

    return NextResponse.json({ error: "Invalid metric type" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in GET /api/economy/metrics:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/economy/metrics - Log custom economy event
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { event_type, metadata } = body;

    if (!event_type) {
      return NextResponse.json(
        { error: "Missing event_type" },
        { status: 400 }
      );
    }

    const supabase = getTiqologyDb();

    // Log to AgentOS event log
    const { data, error } = await supabase
      .from("agentos_event_log")
      .insert({
        event_type: `economy_${event_type}`,
        agent_id: "human-economy",
        user_id: session.user.id,
        status: "completed",
        metadata: {
          ...metadata,
          logged_by: "api",
          user_id: session.user.id,
        },
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to log event: ${error.message}`);
    }

    return NextResponse.json({ event: data }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/economy/metrics:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
