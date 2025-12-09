/**
 * TiQology Human Economy - User Management
 * Handles user identity, roles, and profile management
 */

import DevinLogger from "./devinLogger";
import { getTiqologyDb } from "./tiqologyDb";

// ============================================
// TYPES
// ============================================

export interface TiqUser {
  id: string;
  auth_user_id?: string;
  email: string;
  handle: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  country?: string;
  timezone?: string;
  language?: string;
  role: "user" | "pro" | "elite" | "enterprise" | "admin";
  status: "active" | "suspended" | "deleted";
  is_affiliate: boolean;
  affiliate_code?: string;
  referred_by_code?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_seen_at?: string;
}

export interface CreateUserParams {
  auth_user_id?: string;
  email: string;
  handle: string;
  display_name?: string;
  avatar_url?: string;
  country?: string;
  timezone?: string;
  referred_by_code?: string;
}

export interface UpdateUserParams {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  country?: string;
  timezone?: string;
  language?: string;
}

// ============================================
// USER CRUD OPERATIONS
// ============================================

/**
 * Create a new user
 */
export async function createUser(params: CreateUserParams): Promise<TiqUser> {
  const supabase = getTiqologyDb();

  await DevinLogger.info("Creating new user", {
    metadata: { email: params.email, handle: params.handle },
  });

  try {
    // Check if handle is available
    const { data: existing } = await supabase
      .from("tiq_users")
      .select("id")
      .eq("handle", params.handle)
      .single();

    if (existing) {
      throw new Error(`Handle @${params.handle} is already taken`);
    }

    // Create user
    const { data: user, error } = await supabase
      .from("tiq_users")
      .insert({
        auth_user_id: params.auth_user_id,
        email: params.email,
        handle: params.handle,
        display_name: params.display_name || params.handle,
        avatar_url: params.avatar_url,
        country: params.country,
        timezone: params.timezone || "UTC",
        referred_by_code: params.referred_by_code,
        role: "user",
        status: "active",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    await DevinLogger.info("User created successfully", {
      metadata: { user_id: user.id, handle: user.handle },
    });

    // If user was referred, create referral record
    if (params.referred_by_code) {
      await createReferralFromCode(params.referred_by_code, user.id);
    }

    return user as TiqUser;
  } catch (error) {
    await DevinLogger.error("Failed to create user", {
      error: error as Error,
      metadata: params,
    });
    throw error;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<TiqUser | null> {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("tiq_users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    await DevinLogger.error("Failed to get user by ID", {
      error: error as Error,
      metadata: { userId },
    });
    return null;
  }

  return data as TiqUser;
}

/**
 * Get user by auth user ID
 */
export async function getUserByAuthId(
  authUserId: string
): Promise<TiqUser | null> {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("tiq_users")
    .select("*")
    .eq("auth_user_id", authUserId)
    .single();

  if (error) {
    return null;
  }

  return data as TiqUser;
}

/**
 * Get user by handle
 */
export async function getUserByHandle(handle: string): Promise<TiqUser | null> {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("tiq_users")
    .select("*")
    .eq("handle", handle)
    .single();

  if (error) {
    return null;
  }

  return data as TiqUser;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<TiqUser | null> {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("tiq_users")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    return null;
  }

  return data as TiqUser;
}

/**
 * Update user profile
 */
export async function updateUser(
  userId: string,
  updates: UpdateUserParams
): Promise<TiqUser> {
  const supabase = getTiqologyDb();

  await DevinLogger.info("Updating user profile", {
    metadata: { userId, updates },
  });

  const { data: user, error } = await supabase
    .from("tiq_users")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    await DevinLogger.error("Failed to update user", {
      error: error as Error,
      metadata: { userId, updates },
    });
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return user as TiqUser;
}

/**
 * Update user last seen timestamp
 */
export async function updateUserLastSeen(userId: string): Promise<void> {
  const supabase = getTiqologyDb();

  await supabase
    .from("tiq_users")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", userId);
}

/**
 * Delete user (soft delete)
 */
export async function deleteUser(userId: string): Promise<void> {
  const supabase = getTiqologyDb();

  await DevinLogger.warn("Deleting user", {
    metadata: { userId },
  });

  await supabase
    .from("tiq_users")
    .update({
      status: "deleted",
      deleted_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

// ============================================
// REFERRAL LOGIC
// ============================================

/**
 * Create referral from affiliate code
 */
async function createReferralFromCode(
  affiliateCode: string,
  referredUserId: string
): Promise<void> {
  const supabase = getTiqologyDb();

  try {
    // Get affiliate by code
    const { data: affiliate } = await supabase
      .from("tiq_affiliates")
      .select("id")
      .eq("affiliate_code", affiliateCode)
      .eq("status", "active")
      .single();

    if (!affiliate) {
      await DevinLogger.warn("Invalid or inactive affiliate code", {
        metadata: { affiliateCode },
      });
      return;
    }

    // Create referral
    await supabase.from("tiq_referrals").insert({
      affiliate_id: affiliate.id,
      referred_user_id: referredUserId,
      referral_code: affiliateCode,
      status: "pending", // Will become 'active' when they subscribe
    });

    await DevinLogger.info("Referral created", {
      metadata: {
        affiliate_code: affiliateCode,
        referred_user_id: referredUserId,
      },
    });
  } catch (error) {
    await DevinLogger.error("Failed to create referral", {
      error: error as Error,
      metadata: { affiliateCode, referredUserId },
    });
  }
}

// ============================================
// USER STATISTICS
// ============================================

/**
 * Get user statistics
 */
export async function getUserStats(userId: string) {
  const supabase = getTiqologyDb();

  const [subscriptionData, affiliateData, referralData] = await Promise.all([
    // Get subscription info
    supabase
      .from("tiq_subscriptions")
      .select("*, plan:tiq_plans(*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .single(),

    // Get affiliate info (if user is affiliate)
    supabase
      .from("tiq_affiliates")
      .select("*")
      .eq("user_id", userId)
      .single(),

    // Get referral info (if user was referred)
    supabase
      .from("tiq_referrals")
      .select("*, affiliate:tiq_affiliates(affiliate_code)")
      .eq("referred_user_id", userId)
      .single(),
  ]);

  return {
    subscription: subscriptionData.data || null,
    affiliate: affiliateData.data || null,
    referral: referralData.data || null,
  };
}

/**
 * Check if handle is available
 */
export async function isHandleAvailable(handle: string): Promise<boolean> {
  const supabase = getTiqologyDb();

  const { data } = await supabase
    .from("tiq_users")
    .select("id")
    .eq("handle", handle)
    .single();

  return !data;
}

/**
 * Search users by handle or name
 */
export async function searchUsers(query: string, limit = 10) {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("tiq_users")
    .select("id, handle, display_name, avatar_url, role")
    .or(`handle.ilike.%${query}%,display_name.ilike.%${query}%`)
    .eq("status", "active")
    .limit(limit);

  if (error) {
    await DevinLogger.error("Failed to search users", {
      error: error as Error,
      metadata: { query },
    });
    return [];
  }

  return data;
}

// ============================================
// EXPORTS
// ============================================

export const UserManagement = {
  createUser,
  getUserById,
  getUserByAuthId,
  getUserByHandle,
  getUserByEmail,
  updateUser,
  updateUserLastSeen,
  deleteUser,
  getUserStats,
  isHandleAvailable,
  searchUsers,
};

export default UserManagement;
