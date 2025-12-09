/**
 * TiQology Gamification API Module
 * Handles achievements, XP, levels, streaks, and leaderboards
 */

import { getTiqologyDb } from "./tiqologyDb";

// ============================================
// TYPES
// ============================================

export interface Achievement {
  id: string;
  userId: string;
  achievementType: string;
  achievementName: string;
  description: string | null;
  iconUrl: string | null;
  pointsEarned: number;
  unlockedAt: Date;
  metadata: Record<string, any>;
}

export interface UserLevel {
  id: string;
  userId: string;
  currentLevel: number;
  totalXp: number;
  xpToNextLevel: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastActivityDate: Date;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  category: string;
  score: number;
  rank: number | null;
  period: "all_time" | "monthly" | "weekly" | "daily";
  periodStart: Date;
  periodEnd: Date;
}

export interface XPGainResult {
  newLevel: number;
  totalXp: number;
  leveledUp: boolean;
}

export interface StreakUpdateResult {
  currentStreak: number;
  streakContinued: boolean;
}

// ============================================
// ACHIEVEMENT TYPES
// ============================================

export const ACHIEVEMENT_TYPES = {
  // First-time achievements
  FIRST_EVALUATION: "first_evaluation",
  FIRST_PURCHASE: "first_purchase",
  FIRST_SHARE: "first_share",
  FIRST_FRIEND: "first_friend",

  // Streak achievements
  STREAK_7_DAYS: "streak_7_days",
  STREAK_30_DAYS: "streak_30_days",
  STREAK_100_DAYS: "streak_100_days",
  STREAK_365_DAYS: "streak_365_days",

  // Level achievements
  LEVEL_5: "level_5",
  LEVEL_10: "level_10",
  LEVEL_25: "level_25",
  LEVEL_50: "level_50",
  LEVEL_100: "level_100",

  // Usage achievements
  POWER_USER: "power_user", // Used 5 modules
  SUPER_USER: "super_user", // Used 10 modules
  MODULE_MASTER: "module_master", // Used all modules

  // Social achievements
  POPULAR: "popular", // 10 friends
  INFLUENCER: "influencer", // 100 friends
  SHARER: "sharer", // Shared 10 items

  // Earnings achievements
  FIRST_CASHOUT: "first_cashout",
  EARNER: "earner", // $100 earned
  BIG_EARNER: "big_earner", // $1000 earned
} as const;

// XP rewards for each achievement
export const ACHIEVEMENT_XP: Record<string, number> = {
  [ACHIEVEMENT_TYPES.FIRST_EVALUATION]: 10,
  [ACHIEVEMENT_TYPES.FIRST_PURCHASE]: 20,
  [ACHIEVEMENT_TYPES.FIRST_SHARE]: 15,
  [ACHIEVEMENT_TYPES.FIRST_FRIEND]: 10,

  [ACHIEVEMENT_TYPES.STREAK_7_DAYS]: 50,
  [ACHIEVEMENT_TYPES.STREAK_30_DAYS]: 200,
  [ACHIEVEMENT_TYPES.STREAK_100_DAYS]: 1000,
  [ACHIEVEMENT_TYPES.STREAK_365_DAYS]: 5000,

  [ACHIEVEMENT_TYPES.LEVEL_5]: 50,
  [ACHIEVEMENT_TYPES.LEVEL_10]: 100,
  [ACHIEVEMENT_TYPES.LEVEL_25]: 250,
  [ACHIEVEMENT_TYPES.LEVEL_50]: 500,
  [ACHIEVEMENT_TYPES.LEVEL_100]: 1000,

  [ACHIEVEMENT_TYPES.POWER_USER]: 75,
  [ACHIEVEMENT_TYPES.SUPER_USER]: 150,
  [ACHIEVEMENT_TYPES.MODULE_MASTER]: 500,

  [ACHIEVEMENT_TYPES.POPULAR]: 50,
  [ACHIEVEMENT_TYPES.INFLUENCER]: 500,
  [ACHIEVEMENT_TYPES.SHARER]: 100,

  [ACHIEVEMENT_TYPES.FIRST_CASHOUT]: 25,
  [ACHIEVEMENT_TYPES.EARNER]: 100,
  [ACHIEVEMENT_TYPES.BIG_EARNER]: 500,
};

// ============================================
// FUNCTIONS
// ============================================

/**
 * Award XP to a user and update their level
 */
export async function awardXP(
  userId: string,
  xpAmount: number,
  source?: string
): Promise<XPGainResult> {
  const supabase = getTiqologyDb();

  try {
    const { data, error } = await supabase.rpc("update_user_level", {
      p_user_id: userId,
      p_xp_gained: xpAmount,
    });

    if (error) throw error;

    const result = data[0] as XPGainResult;

    // Check for level-based achievements
    if (result.leveledUp) {
      await checkLevelAchievements(userId, result.newLevel);
    }

    return result;
  } catch (error) {
    console.error("[Gamification] Error awarding XP:", error);
    throw error;
  }
}

/**
 * Update user's daily streak
 */
export async function updateStreak(
  userId: string
): Promise<StreakUpdateResult> {
  const supabase = getTiqologyDb();

  try {
    const { data, error } = await supabase.rpc("update_user_streak", {
      p_user_id: userId,
    });

    if (error) throw error;

    const result = data[0] as StreakUpdateResult;

    // Check for streak-based achievements
    await checkStreakAchievements(userId, result.currentStreak);

    // Award daily login XP
    if (result.streakContinued) {
      await awardXP(userId, 5, "daily_login");
    }

    return result;
  } catch (error) {
    console.error("[Gamification] Error updating streak:", error);
    throw error;
  }
}

/**
 * Unlock an achievement for a user
 */
export async function unlockAchievement(
  userId: string,
  achievementType: string,
  metadata?: Record<string, any>
): Promise<Achievement | null> {
  const supabase = getTiqologyDb();

  try {
    // Check if achievement already unlocked
    const { data: existing } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", userId)
      .eq("achievement_type", achievementType)
      .single();

    if (existing) {
      return null; // Already unlocked
    }

    // Get achievement definition (would be from a config in production)
    const achievementName = achievementType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const pointsEarned = ACHIEVEMENT_XP[achievementType] || 0;

    // Insert achievement
    const { data: achievement, error } = await supabase
      .from("user_achievements")
      .insert({
        user_id: userId,
        achievement_type: achievementType,
        achievement_name: achievementName,
        points_earned: pointsEarned,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    // Award XP for achievement
    await awardXP(userId, pointsEarned, `achievement_${achievementType}`);

    return achievement as Achievement;
  } catch (error) {
    console.error("[Gamification] Error unlocking achievement:", error);
    return null;
  }
}

/**
 * Get user's achievements
 */
export async function getUserAchievements(
  userId: string
): Promise<Achievement[]> {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("user_achievements")
    .select("*")
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false });

  if (error) {
    console.error("[Gamification] Error fetching achievements:", error);
    return [];
  }

  return data as Achievement[];
}

/**
 * Get user's level and stats
 */
export async function getUserLevel(userId: string): Promise<UserLevel | null> {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("user_levels")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // User level doesn't exist, create it
      const { data: newLevel } = await supabase
        .from("user_levels")
        .insert({ user_id: userId })
        .select()
        .single();

      return newLevel as UserLevel;
    }
    console.error("[Gamification] Error fetching user level:", error);
    return null;
  }

  return data as UserLevel;
}

/**
 * Get leaderboard for a category and period
 */
export async function getLeaderboard(
  category: string,
  period: "all_time" | "monthly" | "weekly" | "daily",
  limit = 100
): Promise<LeaderboardEntry[]> {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("leaderboards")
    .select("*")
    .eq("category", category)
    .eq("period", period)
    .order("rank", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[Gamification] Error fetching leaderboard:", error);
    return [];
  }

  return data as LeaderboardEntry[];
}

/**
 * Update leaderboard entry for a user
 */
export async function updateLeaderboard(
  userId: string,
  category: string,
  score: number,
  period: "all_time" | "monthly" | "weekly" | "daily"
): Promise<void> {
  const supabase = getTiqologyDb();

  const { periodStart, periodEnd } = calculatePeriodDates(period);

  try {
    // Upsert leaderboard entry
    await supabase.from("leaderboards").upsert(
      {
        user_id: userId,
        category,
        score,
        period,
        period_start: periodStart,
        period_end: periodEnd,
      },
      {
        onConflict: "user_id,category,period",
      }
    );

    // Recalculate ranks for this category/period
    await recalculateLeaderboardRanks(category, period);
  } catch (error) {
    console.error("[Gamification] Error updating leaderboard:", error);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function checkLevelAchievements(
  userId: string,
  level: number
): Promise<void> {
  const levelAchievements = [
    { level: 5, type: ACHIEVEMENT_TYPES.LEVEL_5 },
    { level: 10, type: ACHIEVEMENT_TYPES.LEVEL_10 },
    { level: 25, type: ACHIEVEMENT_TYPES.LEVEL_25 },
    { level: 50, type: ACHIEVEMENT_TYPES.LEVEL_50 },
    { level: 100, type: ACHIEVEMENT_TYPES.LEVEL_100 },
  ];

  for (const achievement of levelAchievements) {
    if (level >= achievement.level) {
      await unlockAchievement(userId, achievement.type);
    }
  }
}

async function checkStreakAchievements(
  userId: string,
  streak: number
): Promise<void> {
  const streakAchievements = [
    { days: 7, type: ACHIEVEMENT_TYPES.STREAK_7_DAYS },
    { days: 30, type: ACHIEVEMENT_TYPES.STREAK_30_DAYS },
    { days: 100, type: ACHIEVEMENT_TYPES.STREAK_100_DAYS },
    { days: 365, type: ACHIEVEMENT_TYPES.STREAK_365_DAYS },
  ];

  for (const achievement of streakAchievements) {
    if (streak >= achievement.days) {
      await unlockAchievement(userId, achievement.type);
    }
  }
}

function calculatePeriodDates(period: string): {
  periodStart: string;
  periodEnd: string;
} {
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date;

  switch (period) {
    case "daily":
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 1);
      break;

    case "weekly": {
      const dayOfWeek = now.getDay();
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - dayOfWeek);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 7);
      break;
    }

    case "monthly":
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;

    case "all_time":
    default:
      periodStart = new Date(2020, 0, 1); // TiQology founding date
      periodEnd = new Date(2100, 0, 1); // Far future
      break;
  }

  return {
    periodStart: periodStart.toISOString().split("T")[0],
    periodEnd: periodEnd.toISOString().split("T")[0],
  };
}

async function recalculateLeaderboardRanks(
  category: string,
  period: string
): Promise<void> {
  const supabase = getTiqologyDb();

  // This would be better as a SQL function, but for simplicity:
  const { data: entries } = await supabase
    .from("leaderboards")
    .select("id, score")
    .eq("category", category)
    .eq("period", period)
    .order("score", { ascending: false });

  if (!entries) return;

  // Update ranks
  for (let i = 0; i < entries.length; i++) {
    await supabase
      .from("leaderboards")
      .update({ rank: i + 1 })
      .eq("id", entries[i].id);
  }
}

// ============================================
// ACTIVITY TRACKING
// ============================================

/**
 * Track user activity (automatically updates streak and awards daily XP)
 */
export async function trackUserActivity(
  userId: string,
  activityType: string,
  metadata?: Record<string, any>
): Promise<void> {
  // Update streak
  await updateStreak(userId);

  // Award XP based on activity type
  const xpRewards: Record<string, number> = {
    evaluation: 5,
    purchase: 10,
    share: 3,
    friend_add: 5,
    mission_complete: 8,
    survey_complete: 2,
  };

  const xp = xpRewards[activityType] || 1;
  await awardXP(userId, xp, activityType);

  // Check for first-time achievements
  await checkFirstTimeAchievements(userId, activityType);
}

async function checkFirstTimeAchievements(
  userId: string,
  activityType: string
): Promise<void> {
  const firstTimeMap: Record<string, string> = {
    evaluation: ACHIEVEMENT_TYPES.FIRST_EVALUATION,
    purchase: ACHIEVEMENT_TYPES.FIRST_PURCHASE,
    share: ACHIEVEMENT_TYPES.FIRST_SHARE,
    friend_add: ACHIEVEMENT_TYPES.FIRST_FRIEND,
  };

  const achievementType = firstTimeMap[activityType];
  if (achievementType) {
    await unlockAchievement(userId, achievementType);
  }
}
