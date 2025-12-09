/**
 * TiQology Human Economy - Subscription Management
 * Handles subscription plans, Stripe integration, and billing
 */

import DevinLogger from "../devinLogger";
import { getTiqologyDb } from "../tiqologyDb";

// ============================================
// TYPES
// ============================================

export interface TiqPlan {
  id: string;
  plan_code: string;
  plan_name: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  currency: string;
  features: any[];
  limits: Record<string, number>;
  stripe_product_id?: string;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
  is_active: boolean;
  is_featured: boolean;
  metadata?: Record<string, any>;
}

export interface TiqSubscription {
  id: string;
  user_id?: string;
  organization_id?: string;
  plan_id: string;
  billing_period: "monthly" | "yearly";
  amount: number;
  currency: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_payment_method_id?: string;
  status: "active" | "past_due" | "canceled" | "paused";
  trial_ends_at?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionParams {
  user_id?: string;
  organization_id?: string;
  plan_id: string;
  billing_period: "monthly" | "yearly";
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_payment_method_id?: string;
  trial_days?: number;
}

export interface UpdateSubscriptionParams {
  plan_id?: string;
  billing_period?: "monthly" | "yearly";
  status?: "active" | "past_due" | "canceled" | "paused";
  cancel_at_period_end?: boolean;
}

// ============================================
// PLAN MANAGEMENT
// ============================================

/**
 * Get all active plans
 */
export async function getActivePlans(): Promise<TiqPlan[]> {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("tiq_plans")
    .select("*")
    .eq("is_active", true)
    .order("price_monthly", { ascending: true });

  if (error) {
    await DevinLogger.error("Failed to get active plans", {
      error: error as Error,
    });
    return [];
  }

  return data as TiqPlan[];
}

/**
 * Get plan by ID
 */
export async function getPlanById(planId: string): Promise<TiqPlan | null> {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("tiq_plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (error) {
    return null;
  }

  return data as TiqPlan;
}

/**
 * Get plan by code
 */
export async function getPlanByCode(planCode: string): Promise<TiqPlan | null> {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("tiq_plans")
    .select("*")
    .eq("plan_code", planCode)
    .single();

  if (error) {
    return null;
  }

  return data as TiqPlan;
}

// ============================================
// SUBSCRIPTION CRUD
// ============================================

/**
 * Create a new subscription
 */
export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<TiqSubscription> {
  const supabase = getTiqologyDb();

  await DevinLogger.info("Creating new subscription", {
    metadata: params,
  });

  try {
    // Get plan details
    const plan = await getPlanById(params.plan_id);
    if (!plan) {
      throw new Error("Invalid plan ID");
    }

    // Calculate amount based on billing period
    const amount =
      params.billing_period === "monthly"
        ? plan.price_monthly
        : plan.price_yearly;

    if (!amount) {
      throw new Error(
        `Plan ${plan.plan_code} does not support ${params.billing_period} billing`
      );
    }

    // Calculate trial end date
    let trial_ends_at: string | undefined;
    if (params.trial_days && params.trial_days > 0) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + params.trial_days);
      trial_ends_at = trialEnd.toISOString();
    }

    // Calculate period dates
    const period_start = new Date();
    const period_end = new Date();
    if (params.billing_period === "monthly") {
      period_end.setMonth(period_end.getMonth() + 1);
    } else {
      period_end.setFullYear(period_end.getFullYear() + 1);
    }

    // Create subscription
    const { data: subscription, error } = await supabase
      .from("tiq_subscriptions")
      .insert({
        user_id: params.user_id,
        organization_id: params.organization_id,
        plan_id: params.plan_id,
        billing_period: params.billing_period,
        amount,
        currency: plan.currency,
        stripe_customer_id: params.stripe_customer_id,
        stripe_subscription_id: params.stripe_subscription_id,
        stripe_payment_method_id: params.stripe_payment_method_id,
        status: trial_ends_at ? "active" : "active", // Start active even during trial
        trial_ends_at,
        current_period_start: period_start.toISOString(),
        current_period_end: period_end.toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    // Log subscription event
    await logSubscriptionEvent(
      subscription.id,
      "created",
      undefined,
      "active",
      amount,
      plan.currency
    );

    await DevinLogger.info("Subscription created successfully", {
      metadata: {
        subscription_id: subscription.id,
        plan: plan.plan_code,
        amount,
      },
    });

    // Activate referral if user was referred
    if (params.user_id) {
      await activateReferral(params.user_id, subscription.id);
    }

    return subscription as TiqSubscription;
  } catch (error) {
    await DevinLogger.error("Failed to create subscription", {
      error: error as Error,
      metadata: params,
    });
    throw error;
  }
}

/**
 * Get subscription by ID
 */
export async function getSubscriptionById(
  subscriptionId: string
): Promise<TiqSubscription | null> {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("tiq_subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .single();

  if (error) {
    return null;
  }

  return data as TiqSubscription;
}

/**
 * Get active subscription for user
 */
export async function getUserSubscription(
  userId: string
): Promise<TiqSubscription | null> {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("tiq_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return null;
  }

  return data as TiqSubscription;
}

/**
 * Get active subscription for organization
 */
export async function getOrganizationSubscription(
  organizationId: string
): Promise<TiqSubscription | null> {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("tiq_subscriptions")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return null;
  }

  return data as TiqSubscription;
}

/**
 * Update subscription
 */
export async function updateSubscription(
  subscriptionId: string,
  updates: UpdateSubscriptionParams
): Promise<TiqSubscription> {
  const supabase = getTiqologyDb();

  await DevinLogger.info("Updating subscription", {
    metadata: { subscriptionId, updates },
  });

  // Get current subscription
  const currentSub = await getSubscriptionById(subscriptionId);
  if (!currentSub) {
    throw new Error("Subscription not found");
  }

  // If plan is changing, recalculate amount
  let newAmount = currentSub.amount;
  if (updates.plan_id || updates.billing_period) {
    const planId = updates.plan_id || currentSub.plan_id;
    const plan = await getPlanById(planId);
    if (!plan) {
      throw new Error("Invalid plan ID");
    }

    const billingPeriod = updates.billing_period || currentSub.billing_period;
    newAmount =
      billingPeriod === "monthly" ? plan.price_monthly! : plan.price_yearly!;
  }

  const { data: subscription, error } = await supabase
    .from("tiq_subscriptions")
    .update({
      ...updates,
      amount: newAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)
    .select()
    .single();

  if (error) {
    await DevinLogger.error("Failed to update subscription", {
      error: error as Error,
      metadata: { subscriptionId, updates },
    });
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  // Log status change if status updated
  if (updates.status && updates.status !== currentSub.status) {
    await logSubscriptionEvent(
      subscriptionId,
      "status_changed",
      currentSub.status,
      updates.status,
      newAmount,
      currentSub.currency
    );
  }

  return subscription as TiqSubscription;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd = true
): Promise<TiqSubscription> {
  const supabase = getTiqologyDb();

  await DevinLogger.warn("Canceling subscription", {
    metadata: { subscriptionId, cancelAtPeriodEnd },
  });

  const updates: Partial<TiqSubscription> = {
    cancel_at_period_end: cancelAtPeriodEnd,
    updated_at: new Date().toISOString(),
  };

  if (!cancelAtPeriodEnd) {
    updates.status = "canceled";
    updates.canceled_at = new Date().toISOString();
  }

  const { data: subscription, error } = await supabase
    .from("tiq_subscriptions")
    .update(updates)
    .eq("id", subscriptionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }

  // Log cancellation event
  await logSubscriptionEvent(
    subscriptionId,
    cancelAtPeriodEnd ? "cancel_scheduled" : "canceled",
    "active",
    cancelAtPeriodEnd ? "active" : "canceled"
  );

  return subscription as TiqSubscription;
}

// ============================================
// SUBSCRIPTION EVENTS
// ============================================

/**
 * Log subscription event
 */
async function logSubscriptionEvent(
  subscriptionId: string,
  eventType: string,
  previousStatus?: string,
  newStatus?: string,
  amount?: number,
  currency?: string
): Promise<void> {
  const supabase = getTiqologyDb();

  await supabase.from("tiq_subscription_events").insert({
    subscription_id: subscriptionId,
    event_type: eventType,
    previous_status: previousStatus,
    new_status: newStatus,
    amount,
    currency,
  });

  // Also log to AgentOS
  await supabase.from("agentos_event_log").insert({
    event_type: "subscription_" + eventType,
    agent_id: "human-economy",
    status: "completed",
    metadata: {
      subscription_id: subscriptionId,
      previous_status: previousStatus,
      new_status: newStatus,
      amount,
      currency,
    },
  });
}

// ============================================
// REFERRAL ACTIVATION
// ============================================

/**
 * Activate referral when user subscribes
 */
async function activateReferral(
  userId: string,
  subscriptionId: string
): Promise<void> {
  const supabase = getTiqologyDb();

  try {
    // Check if user has a referral
    const { data: referral } = await supabase
      .from("tiq_referrals")
      .select("*")
      .eq("referred_user_id", userId)
      .eq("status", "pending")
      .single();

    if (!referral) {
      return; // No referral to activate
    }

    // Update referral to active
    await supabase
      .from("tiq_referrals")
      .update({
        status: "active",
        subscription_id: subscriptionId,
        first_payment_at: new Date().toISOString(),
      })
      .eq("id", referral.id);

    // Create first commission for affiliate
    const subscription = await getSubscriptionById(subscriptionId);
    if (subscription) {
      await createCommission(
        referral.affiliate_id,
        referral.id,
        subscriptionId,
        "one_time",
        subscription.amount
      );
    }

    await DevinLogger.info("Referral activated", {
      metadata: {
        referral_id: referral.id,
        user_id: userId,
        subscription_id: subscriptionId,
      },
    });
  } catch (error) {
    await DevinLogger.error("Failed to activate referral", {
      error: error as Error,
      metadata: { userId, subscriptionId },
    });
  }
}

/**
 * Create affiliate commission
 */
async function createCommission(
  affiliateId: string,
  referralId: string,
  subscriptionId: string,
  commissionType: "recurring" | "one_time" | "bonus",
  subscriptionAmount: number
): Promise<void> {
  const supabase = getTiqologyDb();

  // Get affiliate commission rate
  const { data: affiliate } = await supabase
    .from("tiq_affiliates")
    .select("commission_rate_recurring, commission_rate_one_time")
    .eq("id", affiliateId)
    .single();

  if (!affiliate) {
    return;
  }

  const commissionRate =
    commissionType === "one_time"
      ? affiliate.commission_rate_one_time
      : affiliate.commission_rate_recurring;

  const commissionAmount = (subscriptionAmount * commissionRate) / 100;

  await supabase.from("tiq_affiliate_commissions").insert({
    affiliate_id: affiliateId,
    referral_id: referralId,
    subscription_id: subscriptionId,
    commission_type: commissionType,
    amount: commissionAmount,
    currency: "USD",
    subscription_payment_amount: subscriptionAmount,
    commission_rate: commissionRate,
    status: "pending",
  });

  await DevinLogger.info("Commission created", {
    metadata: {
      affiliate_id: affiliateId,
      commission_type: commissionType,
      amount: commissionAmount,
    },
  });
}

// ============================================
// STRIPE INTEGRATION HELPERS
// ============================================

/**
 * Create Stripe checkout session URL
 * Note: This is a placeholder - real Stripe integration would use Stripe SDK
 */
export async function createCheckoutSession(
  planId: string,
  userId: string,
  billingPeriod: "monthly" | "yearly",
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  // TODO: Implement real Stripe checkout session creation
  // For now, return a placeholder URL

  await DevinLogger.info("Creating Stripe checkout session", {
    metadata: { planId, userId, billingPeriod },
  });

  // In production, this would call:
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  // const session = await stripe.checkout.sessions.create({...});
  // return session.url;

  return `https://checkout.stripe.com/placeholder?plan=${planId}&period=${billingPeriod}`;
}

/**
 * Handle Stripe webhook events
 * Note: This is a placeholder - real implementation would parse Stripe events
 */
export async function handleStripeWebhook(
  eventType: string,
  eventData: any
): Promise<void> {
  await DevinLogger.info("Handling Stripe webhook", {
    metadata: { eventType },
  });

  // TODO: Implement real Stripe webhook handling
  // Examples:
  // - customer.subscription.created
  // - customer.subscription.updated
  // - customer.subscription.deleted
  // - invoice.payment_succeeded
  // - invoice.payment_failed
}

// ============================================
// EXPORTS
// ============================================

export const SubscriptionManagement = {
  getActivePlans,
  getPlanById,
  getPlanByCode,
  createSubscription,
  getSubscriptionById,
  getUserSubscription,
  getOrganizationSubscription,
  updateSubscription,
  cancelSubscription,
  createCheckoutSession,
  handleStripeWebhook,
};

export default SubscriptionManagement;
