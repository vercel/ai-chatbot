/**
 * TiQology Human Economy - Subscription Management API
 * Handles subscription creation, updates, and Stripe integration
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  cancelSubscription,
  createCheckoutSession,
  createSubscription,
  getActivePlans,
  getPlanByCode,
  getUserSubscription,
  updateSubscription,
} from "@/lib/humanEconomy/subscriptionManagement";

// GET /api/economy/subscriptions - Get active plans or current subscription
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Get all active plans (public)
    if (action === "plans") {
      const plans = await getActivePlans();
      return NextResponse.json({ plans });
    }

    // Get current user's subscription (requires auth)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getUserSubscription(session.user.id);
    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("Error in GET /api/economy/subscriptions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/economy/subscriptions - Create subscription or checkout session
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, plan_code, billing_period, success_url, cancel_url } = body;

    // Create Stripe checkout session
    if (action === "checkout") {
      if (!plan_code || !billing_period) {
        return NextResponse.json(
          { error: "Missing required fields: plan_code, billing_period" },
          { status: 400 }
        );
      }

      const plan = await getPlanByCode(plan_code);
      if (!plan) {
        return NextResponse.json(
          { error: "Invalid plan code" },
          { status: 400 }
        );
      }

      const checkoutUrl = await createCheckoutSession(
        plan.id,
        session.user.id,
        billing_period,
        success_url ||
          `${request.nextUrl.origin}/dashboard?subscription=success`,
        cancel_url || `${request.nextUrl.origin}/pricing`
      );

      return NextResponse.json({ checkout_url: checkoutUrl });
    }

    // Create subscription directly (for testing or admin)
    const { plan_id, trial_days, stripe_customer_id, stripe_subscription_id } =
      body;

    if (!plan_id || !billing_period) {
      return NextResponse.json(
        { error: "Missing required fields: plan_id, billing_period" },
        { status: 400 }
      );
    }

    const subscription = await createSubscription({
      user_id: session.user.id,
      plan_id,
      billing_period,
      trial_days,
      stripe_customer_id,
      stripe_subscription_id,
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/economy/subscriptions:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/economy/subscriptions - Update subscription
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subscription_id, plan_id, billing_period, status } = body;

    if (!subscription_id) {
      return NextResponse.json(
        { error: "Missing subscription_id" },
        { status: 400 }
      );
    }

    const updatedSubscription = await updateSubscription(subscription_id, {
      plan_id,
      billing_period,
      status,
    });

    return NextResponse.json(updatedSubscription);
  } catch (error: any) {
    console.error("Error in PATCH /api/economy/subscriptions:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/economy/subscriptions - Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get("id");
    const cancelAtPeriodEnd =
      searchParams.get("cancel_at_period_end") !== "false";

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Missing subscription id" },
        { status: 400 }
      );
    }

    const canceledSubscription = await cancelSubscription(
      subscriptionId,
      cancelAtPeriodEnd
    );

    return NextResponse.json(canceledSubscription);
  } catch (error: any) {
    console.error("Error in DELETE /api/economy/subscriptions:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
