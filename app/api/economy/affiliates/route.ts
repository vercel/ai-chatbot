/**
 * TiQology Human Economy - Affiliate System API
 * Handles affiliate registration, referral tracking, and dashboard
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  approveCommission,
  createPayout,
  getAffiliateByCode,
  getAffiliateByUserId,
  getAffiliateCommissions,
  getAffiliateDashboard,
  getAffiliatePayouts,
  getAffiliateReferrals,
  registerAffiliate,
  trackReferral,
} from "@/lib/humanEconomy/affiliateSystem";

// GET /api/economy/affiliates - Get affiliate info or dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const code = searchParams.get("code");

    // Validate affiliate code
    if (action === "validate") {
      if (!code) {
        return NextResponse.json(
          { error: "Missing code parameter" },
          { status: 400 }
        );
      }

      const affiliate = await getAffiliateByCode(code);
      return NextResponse.json({
        valid: !!affiliate,
        affiliate: affiliate
          ? {
              code: affiliate.affiliate_code,
              status: affiliate.status,
            }
          : null,
      });
    }

    // Get current user's affiliate info
    const affiliate = await getAffiliateByUserId(session.user.id);
    if (!affiliate) {
      return NextResponse.json(
        { error: "User is not an affiliate" },
        { status: 404 }
      );
    }

    // Get dashboard data
    if (action === "dashboard") {
      const dashboard = await getAffiliateDashboard(affiliate.id);
      return NextResponse.json(dashboard);
    }

    // Get referrals
    if (action === "referrals") {
      const status = searchParams.get("status") as
        | "pending"
        | "active"
        | "churned"
        | undefined;
      const referrals = await getAffiliateReferrals(affiliate.id, status);
      return NextResponse.json({ referrals });
    }

    // Get commissions
    if (action === "commissions") {
      const status = searchParams.get("status") as
        | "pending"
        | "approved"
        | "paid"
        | undefined;
      const commissions = await getAffiliateCommissions(affiliate.id, status);
      return NextResponse.json({ commissions });
    }

    // Get payouts
    if (action === "payouts") {
      const payouts = await getAffiliatePayouts(affiliate.id);
      return NextResponse.json({ payouts });
    }

    // Default: return affiliate info
    return NextResponse.json({ affiliate });
  } catch (error) {
    console.error("Error in GET /api/economy/affiliates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/economy/affiliates - Register as affiliate or track referral
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      action,
      custom_code,
      referral_code,
      payment_method,
      amount,
      payment_details,
    } = body;

    // Register as affiliate
    if (action === "register") {
      const affiliate = await registerAffiliate(session.user.id, custom_code);
      return NextResponse.json(affiliate, { status: 201 });
    }

    // Track referral (used during signup)
    if (action === "track_referral") {
      if (!referral_code) {
        return NextResponse.json(
          { error: "Missing referral_code" },
          { status: 400 }
        );
      }

      const referral = await trackReferral(referral_code, session.user.id);
      return NextResponse.json(referral, { status: 201 });
    }

    // Request payout
    if (action === "request_payout") {
      const affiliate = await getAffiliateByUserId(session.user.id);
      if (!affiliate) {
        return NextResponse.json(
          { error: "User is not an affiliate" },
          { status: 404 }
        );
      }

      if (!payment_method || !amount) {
        return NextResponse.json(
          { error: "Missing required fields: payment_method, amount" },
          { status: 400 }
        );
      }

      const payout = await createPayout(
        affiliate.id,
        amount,
        payment_method,
        payment_details
      );

      return NextResponse.json(payout, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in POST /api/economy/affiliates:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/economy/affiliates - Approve commission (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin role check
    // For now, allow any authenticated user (testing)

    const body = await request.json();
    const { commission_id } = body;

    if (!commission_id) {
      return NextResponse.json(
        { error: "Missing commission_id" },
        { status: 400 }
      );
    }

    const commission = await approveCommission(commission_id);
    return NextResponse.json(commission);
  } catch (error: any) {
    console.error("Error in PATCH /api/economy/affiliates:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
