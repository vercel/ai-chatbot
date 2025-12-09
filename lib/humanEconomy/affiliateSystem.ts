/**
 * TiQology Human Economy - Affiliate System
 * Handles affiliate registration, referral tracking, and payouts
 * Implements CK1/EK2/DK3 affiliate code generation logic
 */

import DevinLogger from "../devinLogger";
import { getTiqologyDb } from "../tiqologyDb";

// ============================================
// TYPES
// ============================================

export interface TiqAffiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  commission_rate_recurring: number;
  commission_rate_one_time: number;
  total_referrals: number;
  active_referrals: number;
  total_earnings: number;
  total_payouts: number;
  pending_earnings: number;
  status: "active" | "paused" | "banned";
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TiqReferral {
  id: string;
  affiliate_id: string;
  referred_user_id: string;
  subscription_id?: string;
  referral_code_used: string;
  status: "pending" | "active" | "churned";
  first_payment_at?: string;
  last_payment_at?: string;
  total_commission_earned: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface TiqCommission {
  id: string;
  affiliate_id: string;
  referral_id: string;
  subscription_id: string;
  commission_type: "recurring" | "one_time" | "bonus";
  amount: number;
  currency: string;
  subscription_payment_amount: number;
  commission_rate: number;
  payout_id?: string;
  status: "pending" | "approved" | "paid";
  created_at: string;
}

export interface TiqPayout {
  id: string;
  affiliate_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_details?: Record<string, any>;
  status: "pending" | "processing" | "completed" | "failed";
  processed_at?: string;
  completed_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// ============================================
// AFFILIATE REGISTRATION
// ============================================

/**
 * Register a new affiliate
 */
export async function registerAffiliate(
  userId: string,
  customCode?: string
): Promise<TiqAffiliate> {
  const supabase = getTiqologyDb();

  await DevinLogger.info("Registering new affiliate", {
    metadata: { userId, customCode },
  });

  try {
    // Check if user is already an affiliate
    const { data: existing } = await supabase
      .from("tiq_affiliates")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (existing) {
      throw new Error("User is already an affiliate");
    }

    // Generate affiliate code if not provided
    let affiliateCode = customCode;
    if (!affiliateCode) {
      // Get user initials
      const { data: user } = await supabase
        .from("tiq_users")
        .select("display_name, handle")
        .eq("id", userId)
        .single();

      if (!user) {
        throw new Error("User not found");
      }

      // Extract initials from display_name or handle
      const name = user.display_name || user.handle;
      const initials = extractInitials(name);

      // Generate code via database function
      const { data: codeResult, error: codeError } = await supabase.rpc(
        "generate_affiliate_code",
        { initials }
      );

      if (codeError || !codeResult) {
        throw new Error("Failed to generate affiliate code");
      }

      affiliateCode = codeResult;
    }

    // Create affiliate record
    const { data: affiliate, error } = await supabase
      .from("tiq_affiliates")
      .insert({
        user_id: userId,
        affiliate_code: affiliateCode,
        commission_rate_recurring: 20, // 20% recurring
        commission_rate_one_time: 30, // 30% one-time
        status: "active",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create affiliate: ${error.message}`);
    }

    // Update user to mark as affiliate
    await supabase
      .from("tiq_users")
      .update({
        is_affiliate: true,
        affiliate_code: affiliateCode,
      })
      .eq("id", userId);

    await DevinLogger.info("Affiliate registered successfully", {
      metadata: {
        affiliate_id: affiliate.id,
        affiliate_code: affiliateCode,
      },
    });

    return affiliate as TiqAffiliate;
  } catch (error) {
    await DevinLogger.error("Failed to register affiliate", {
      error: error as Error,
      metadata: { userId, customCode },
    });
    throw error;
  }
}

/**
 * Extract initials from name (for CK1/EK2/DK3 generation)
 */
function extractInitials(name: string): string {
  const cleaned = name.trim().toUpperCase();

  // Split by spaces
  const parts = cleaned.split(/\s+/);

  if (parts.length >= 2) {
    // First name + Last name initials
    return parts[0][0] + parts[parts.length - 1][0];
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    // Single word - take first 2 letters
    return parts[0].substring(0, 2);
  }
  // Fallback
  return "XX";
}

// ============================================
// AFFILIATE LOOKUP
// ============================================

/**
 * Get affiliate by ID
 */
export async function getAffiliateById(
  affiliateId: string
): Promise<TiqAffiliate | null> {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("tiq_affiliates")
    .select("*")
    .eq("id", affiliateId)
    .single();

  if (error) {
    return null;
  }

  return data as TiqAffiliate;
}

/**
 * Get affiliate by user ID
 */
export async function getAffiliateByUserId(
  userId: string
): Promise<TiqAffiliate | null> {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("tiq_affiliates")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    return null;
  }

  return data as TiqAffiliate;
}

/**
 * Get affiliate by code
 */
export async function getAffiliateByCode(
  affiliateCode: string
): Promise<TiqAffiliate | null> {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("tiq_affiliates")
    .select("*")
    .eq("affiliate_code", affiliateCode.toUpperCase())
    .single();

  if (error) {
    return null;
  }

  return data as TiqAffiliate;
}

// ============================================
// REFERRAL TRACKING
// ============================================

/**
 * Track a new referral
 */
export async function trackReferral(
  affiliateCode: string,
  referredUserId: string
): Promise<TiqReferral> {
  const supabase = getTiqologyDb();

  await DevinLogger.info("Tracking new referral", {
    metadata: { affiliateCode, referredUserId },
  });

  try {
    // Get affiliate by code
    const affiliate = await getAffiliateByCode(affiliateCode);
    if (!affiliate) {
      throw new Error("Invalid affiliate code");
    }

    if (affiliate.status !== "active") {
      throw new Error("Affiliate is not active");
    }

    // Check for duplicate referral
    const { data: existing } = await supabase
      .from("tiq_referrals")
      .select("*")
      .eq("affiliate_id", affiliate.id)
      .eq("referred_user_id", referredUserId)
      .single();

    if (existing) {
      // Return existing referral
      return existing as TiqReferral;
    }

    // Create referral record
    const { data: referral, error } = await supabase
      .from("tiq_referrals")
      .insert({
        affiliate_id: affiliate.id,
        referred_user_id: referredUserId,
        referral_code_used: affiliateCode,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create referral: ${error.message}`);
    }

    await DevinLogger.info("Referral tracked successfully", {
      metadata: {
        referral_id: referral.id,
        affiliate_id: affiliate.id,
      },
    });

    return referral as TiqReferral;
  } catch (error) {
    await DevinLogger.error("Failed to track referral", {
      error: error as Error,
      metadata: { affiliateCode, referredUserId },
    });
    throw error;
  }
}

/**
 * Get all referrals for an affiliate
 */
export async function getAffiliateReferrals(
  affiliateId: string,
  status?: "pending" | "active" | "churned"
): Promise<TiqReferral[]> {
  const supabase = getTiqologyDb();

  let query = supabase
    .from("tiq_referrals")
    .select("*")
    .eq("affiliate_id", affiliateId);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    await DevinLogger.error("Failed to get affiliate referrals", {
      error: error as Error,
      metadata: { affiliateId },
    });
    return [];
  }

  return data as TiqReferral[];
}

// ============================================
// COMMISSION MANAGEMENT
// ============================================

/**
 * Calculate and create commission
 */
export async function createCommission(
  affiliateId: string,
  referralId: string,
  subscriptionId: string,
  commissionType: "recurring" | "one_time" | "bonus",
  subscriptionAmount: number,
  currency = "USD"
): Promise<TiqCommission> {
  const supabase = getTiqologyDb();

  await DevinLogger.info("Creating commission", {
    metadata: {
      affiliateId,
      referralId,
      subscriptionId,
      commissionType,
      subscriptionAmount,
    },
  });

  try {
    // Get affiliate commission rates
    const affiliate = await getAffiliateById(affiliateId);
    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    // Calculate commission amount
    const commissionRate =
      commissionType === "one_time"
        ? affiliate.commission_rate_one_time
        : affiliate.commission_rate_recurring;

    const amount = (subscriptionAmount * commissionRate) / 100;

    // Create commission record
    const { data: commission, error } = await supabase
      .from("tiq_affiliate_commissions")
      .insert({
        affiliate_id: affiliateId,
        referral_id: referralId,
        subscription_id: subscriptionId,
        commission_type: commissionType,
        amount,
        currency,
        subscription_payment_amount: subscriptionAmount,
        commission_rate: commissionRate,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create commission: ${error.message}`);
    }

    await DevinLogger.info("Commission created successfully", {
      metadata: {
        commission_id: commission.id,
        amount,
        commission_type: commissionType,
      },
    });

    return commission as TiqCommission;
  } catch (error) {
    await DevinLogger.error("Failed to create commission", {
      error: error as Error,
      metadata: { affiliateId, referralId, subscriptionId },
    });
    throw error;
  }
}

/**
 * Get all commissions for an affiliate
 */
export async function getAffiliateCommissions(
  affiliateId: string,
  status?: "pending" | "approved" | "paid"
): Promise<TiqCommission[]> {
  const supabase = getTiqologyDb();

  let query = supabase
    .from("tiq_affiliate_commissions")
    .select("*")
    .eq("affiliate_id", affiliateId);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data as TiqCommission[];
}

/**
 * Approve commission for payout
 */
export async function approveCommission(
  commissionId: string
): Promise<TiqCommission> {
  const supabase = getTiqologyDb();

  const { data: commission, error } = await supabase
    .from("tiq_affiliate_commissions")
    .update({ status: "approved" })
    .eq("id", commissionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to approve commission: ${error.message}`);
  }

  await DevinLogger.info("Commission approved", {
    metadata: { commission_id: commissionId },
  });

  return commission as TiqCommission;
}

// ============================================
// PAYOUT MANAGEMENT
// ============================================

/**
 * Create a payout request
 */
export async function createPayout(
  affiliateId: string,
  amount: number,
  paymentMethod: string,
  paymentDetails?: Record<string, any>
): Promise<TiqPayout> {
  const supabase = getTiqologyDb();

  await DevinLogger.info("Creating payout", {
    metadata: { affiliateId, amount, paymentMethod },
  });

  try {
    // Verify affiliate has enough pending earnings
    const affiliate = await getAffiliateById(affiliateId);
    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    if (affiliate.pending_earnings < amount) {
      throw new Error(
        `Insufficient pending earnings. Available: $${affiliate.pending_earnings}, Requested: $${amount}`
      );
    }

    // Create payout record
    const { data: payout, error } = await supabase
      .from("tiq_affiliate_payouts")
      .insert({
        affiliate_id: affiliateId,
        amount,
        currency: "USD",
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create payout: ${error.message}`);
    }

    // Mark approved commissions as part of this payout
    const approvedCommissions = await getAffiliateCommissions(
      affiliateId,
      "approved"
    );

    let totalAssigned = 0;
    for (const commission of approvedCommissions) {
      if (totalAssigned + commission.amount <= amount) {
        await supabase
          .from("tiq_affiliate_commissions")
          .update({
            payout_id: payout.id,
            status: "paid",
          })
          .eq("id", commission.id);

        totalAssigned += commission.amount;

        if (totalAssigned >= amount) break;
      }
    }

    await DevinLogger.info("Payout created successfully", {
      metadata: {
        payout_id: payout.id,
        amount,
        commissions_assigned: totalAssigned,
      },
    });

    return payout as TiqPayout;
  } catch (error) {
    await DevinLogger.error("Failed to create payout", {
      error: error as Error,
      metadata: { affiliateId, amount },
    });
    throw error;
  }
}

/**
 * Update payout status
 */
export async function updatePayoutStatus(
  payoutId: string,
  status: "pending" | "processing" | "completed" | "failed"
): Promise<TiqPayout> {
  const supabase = getTiqologyDb();

  const updates: any = { status };

  if (status === "processing") {
    updates.processed_at = new Date().toISOString();
  } else if (status === "completed") {
    updates.completed_at = new Date().toISOString();
  }

  const { data: payout, error } = await supabase
    .from("tiq_affiliate_payouts")
    .update(updates)
    .eq("id", payoutId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update payout status: ${error.message}`);
  }

  await DevinLogger.info("Payout status updated", {
    metadata: { payout_id: payoutId, status },
  });

  return payout as TiqPayout;
}

/**
 * Get all payouts for an affiliate
 */
export async function getAffiliatePayouts(
  affiliateId: string
): Promise<TiqPayout[]> {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("tiq_affiliate_payouts")
    .select("*")
    .eq("affiliate_id", affiliateId)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data as TiqPayout[];
}

// ============================================
// AFFILIATE DASHBOARD
// ============================================

/**
 * Get comprehensive affiliate stats
 */
export async function getAffiliateDashboard(affiliateId: string): Promise<{
  affiliate: TiqAffiliate;
  referrals: {
    total: number;
    active: number;
    pending: number;
    churned: number;
  };
  earnings: {
    total: number;
    pending: number;
    paid: number;
  };
  commissions: {
    total: number;
    pending: number;
    approved: number;
    paid: number;
  };
  recentReferrals: TiqReferral[];
  recentCommissions: TiqCommission[];
  recentPayouts: TiqPayout[];
}> {
  const affiliate = await getAffiliateById(affiliateId);
  if (!affiliate) {
    throw new Error("Affiliate not found");
  }

  const allReferrals = await getAffiliateReferrals(affiliateId);
  const allCommissions = await getAffiliateCommissions(affiliateId);
  const allPayouts = await getAffiliatePayouts(affiliateId);

  const referrals = {
    total: allReferrals.length,
    active: allReferrals.filter((r) => r.status === "active").length,
    pending: allReferrals.filter((r) => r.status === "pending").length,
    churned: allReferrals.filter((r) => r.status === "churned").length,
  };

  const earnings = {
    total: affiliate.total_earnings,
    pending: affiliate.pending_earnings,
    paid: affiliate.total_payouts,
  };

  const commissions = {
    total: allCommissions.length,
    pending: allCommissions.filter((c) => c.status === "pending").length,
    approved: allCommissions.filter((c) => c.status === "approved").length,
    paid: allCommissions.filter((c) => c.status === "paid").length,
  };

  return {
    affiliate,
    referrals,
    earnings,
    commissions,
    recentReferrals: allReferrals.slice(0, 10),
    recentCommissions: allCommissions.slice(0, 10),
    recentPayouts: allPayouts.slice(0, 10),
  };
}

// ============================================
// EXPORTS
// ============================================

export const AffiliateSystem = {
  registerAffiliate,
  getAffiliateById,
  getAffiliateByUserId,
  getAffiliateByCode,
  trackReferral,
  getAffiliateReferrals,
  createCommission,
  getAffiliateCommissions,
  approveCommission,
  createPayout,
  updatePayoutStatus,
  getAffiliatePayouts,
  getAffiliateDashboard,
};

export default AffiliateSystem;
