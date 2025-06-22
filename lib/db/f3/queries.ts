import { and, asc, count, desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import { createConnection } from 'mysql2/promise';
import { getEnv } from '@/lib/env';

import {
  achievementsAwarded,
  achievementsList,
  achievementsView,
  aos,
  attendanceView,
  backblast,
  bdAttendance,
  beatdownInfo,
  beatdowns,
  users,
} from './migrations/schema';
import { ChatSDKError } from '../../errors';

const { MYSQL_URL } = getEnv();
const connection = await createConnection(MYSQL_URL);
export const db = drizzle(connection);

// User queries
export async function getUser(userId: string) {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);
    return user;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get user by ID');
  }
}

export async function getUserByEmail(email: string) {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    );
  }
}

export async function createUser({
  userId,
  userName,
  realName,
  phone,
  email,
  startDate,
  app = 0,
}: {
  userId: string;
  userName: string;
  realName: string;
  phone?: string;
  email?: string;
  startDate?: string;
  app?: number;
}) {
  try {
    return await db.insert(users).values({
      userId,
      userName,
      realName,
      phone,
      email,
      startDate,
      app,
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function updateUser({
  userId,
  updates,
}: {
  userId: string;
  updates: Partial<typeof users.$inferInsert>;
}) {
  try {
    return await db.update(users).set(updates).where(eq(users.userId, userId));
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to update user');
  }
}

// Achievement queries
export async function getAchievementsList() {
  try {
    return await db
      .select()
      .from(achievementsList)
      .orderBy(asc(achievementsList.name));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get achievements list',
    );
  }
}

export async function getAchievementById(id: number) {
  try {
    const [achievement] = await db
      .select()
      .from(achievementsList)
      .where(eq(achievementsList.id, id))
      .limit(1);
    return achievement;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get achievement by ID',
    );
  }
}

export async function awardAchievement({
  achievementId,
  paxId,
  dateAwarded,
}: {
  achievementId: number;
  paxId: string;
  dateAwarded: string;
}) {
  try {
    return await db.insert(achievementsAwarded).values({
      achievementId,
      paxId,
      dateAwarded,
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to award achievement',
    );
  }
}

export async function getAchievementsByUser(paxId: string) {
  try {
    return await db
      .select()
      .from(achievementsView)
      .where(eq(achievementsView.paxId, paxId))
      .orderBy(desc(achievementsView.dateAwarded));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get achievements by user',
    );
  }
}

// AO (Area of Operations) queries
export async function getAOs() {
  try {
    return await db.select().from(aos).orderBy(asc(aos.ao));
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get AOs');
  }
}

export async function getAOByChannelId(channelId: string) {
  try {
    const [ao] = await db
      .select()
      .from(aos)
      .where(eq(aos.channelId, channelId))
      .limit(1);
    return ao;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get AO by channel ID',
    );
  }
}

export async function createAO({
  channelId,
  ao,
  channelCreated,
  archived = 0,
  backblast,
  siteQUserId,
}: {
  channelId: string;
  ao: string;
  channelCreated: number;
  archived?: number;
  backblast?: number;
  siteQUserId?: string;
}) {
  try {
    return await db.insert(aos).values({
      channelId,
      ao,
      channelCreated,
      archived,
      backblast,
      siteQUserId,
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create AO');
  }
}

// Beatdown queries
export async function getBeatdowns({
  limit = 50,
  offset = 0,
  aoId,
  qUserId,
}: {
  limit?: number;
  offset?: number;
  aoId?: string;
  qUserId?: string;
} = {}) {
  try {
    const conditions = [];
    if (aoId) {
      conditions.push(eq(beatdowns.aoId, aoId));
    }
    if (qUserId) {
      conditions.push(eq(beatdowns.qUserId, qUserId));
    }

    const whereCondition =
      conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(beatdowns)
      .where(whereCondition)
      .orderBy(desc(beatdowns.bdDate))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get beatdowns');
  }
}

export async function getBeatdownByKey({
  aoId,
  bdDate,
  qUserId,
}: {
  aoId: string;
  bdDate: string;
  qUserId: string;
}) {
  try {
    const [beatdown] = await db
      .select()
      .from(beatdowns)
      .where(
        and(
          eq(beatdowns.aoId, aoId),
          eq(beatdowns.bdDate, bdDate),
          eq(beatdowns.qUserId, qUserId),
        ),
      )
      .limit(1);
    return beatdown;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get beatdown by key',
    );
  }
}

export async function createBeatdown({
  aoId,
  bdDate,
  qUserId,
  coqUserId,
  paxCount,
  backblast,
  backblastParsed,
  fngs,
  fngCount,
  json,
}: {
  aoId: string;
  bdDate: string;
  qUserId: string;
  coqUserId?: string;
  paxCount?: number;
  backblast?: string;
  backblastParsed?: string;
  fngs?: string;
  fngCount?: number;
  json?: any;
}) {
  try {
    return await db.insert(beatdowns).values({
      aoId,
      bdDate,
      qUserId,
      coqUserId,
      paxCount,
      backblast,
      backblastParsed,
      fngs,
      fngCount,
      json,
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create beatdown');
  }
}

// Attendance queries
export async function getAttendanceByBeatdown({
  aoId,
  date,
  qUserId,
}: {
  aoId: string;
  date: string;
  qUserId: string;
}) {
  try {
    return await db
      .select()
      .from(bdAttendance)
      .where(
        and(
          eq(bdAttendance.aoId, aoId),
          eq(bdAttendance.date, date),
          eq(bdAttendance.qUserId, qUserId),
        ),
      );
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get attendance by beatdown',
    );
  }
}

export async function markAttendance({
  userId,
  aoId,
  date,
  qUserId,
  json,
}: {
  userId: string;
  aoId: string;
  date: string;
  qUserId: string;
  json?: any;
}) {
  try {
    return await db.insert(bdAttendance).values({
      userId,
      aoId,
      date,
      qUserId,
      json,
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to mark attendance');
  }
}

// Backblast queries
export async function getBackblasts({
  limit = 50,
  offset = 0,
  ao,
  q,
}: {
  limit?: number;
  offset?: number;
  ao?: string;
  q?: string;
} = {}) {
  try {
    const conditions = [];
    if (ao) {
      conditions.push(eq(backblast.ao, ao));
    }
    if (q) {
      conditions.push(eq(backblast.q, q));
    }

    const whereCondition =
      conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(backblast)
      .where(whereCondition)
      .orderBy(desc(backblast.date))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get backblasts');
  }
}

export async function createBackblast({
  date,
  ao,
  q,
  coQ,
  paxCount,
  fngs,
  fngCount,
  backblast: backblastText,
}: {
  date: string;
  ao?: string;
  q: string;
  coQ?: string;
  paxCount?: number;
  fngs?: string;
  fngCount?: number;
  backblast?: string;
}) {
  try {
    return await db.insert(backblast).values({
      date,
      ao,
      q,
      coQ,
      paxCount,
      fngs,
      fngCount,
      backblast: backblastText,
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create backblast',
    );
  }
}

// Beatdown info queries
export async function getBeatdownInfo({
  limit = 50,
  offset = 0,
  ao,
  q,
}: {
  limit?: number;
  offset?: number;
  ao?: string;
  q?: string;
} = {}) {
  try {
    const conditions = [];
    if (ao) {
      conditions.push(eq(beatdownInfo.ao, ao));
    }
    if (q) {
      conditions.push(eq(beatdownInfo.q, q));
    }

    const whereCondition =
      conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(beatdownInfo)
      .where(whereCondition)
      .orderBy(desc(beatdownInfo.date))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get beatdown info',
    );
  }
}

// Attendance view queries
export async function getAttendanceView({
  date,
  ao,
  pax,
  q,
}: {
  date?: string;
  ao?: string;
  pax?: string;
  q?: string;
} = {}) {
  try {
    const conditions = [];
    if (date) {
      conditions.push(eq(attendanceView.date, date));
    }
    if (ao) {
      conditions.push(eq(attendanceView.ao, ao));
    }
    if (pax) {
      conditions.push(eq(attendanceView.pax, pax));
    }
    if (q) {
      conditions.push(eq(attendanceView.q, q));
    }

    const whereCondition =
      conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(attendanceView)
      .where(whereCondition)
      .orderBy(desc(attendanceView.date));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get attendance view',
    );
  }
}

// Statistics queries
export async function getUserStats(userId: string) {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (!user) {
      throw new ChatSDKError('not_found:database', 'User not found');
    }

    // Get achievements count
    const achievementsCount = await db
      .select({ count: count(achievementsAwarded.id) })
      .from(achievementsAwarded)
      .where(eq(achievementsAwarded.paxId, userId));

    // Get beatdowns as Q count
    const qCount = await db
      .select({ count: count(beatdowns.aoId) })
      .from(beatdowns)
      .where(eq(beatdowns.qUserId, userId));

    // Get attendance count
    const attendanceCount = await db
      .select({ count: count(bdAttendance.userId) })
      .from(bdAttendance)
      .where(eq(bdAttendance.userId, userId));

    return {
      user,
      stats: {
        achievements: achievementsCount[0]?.count ?? 0,
        beatdownsAsQ: qCount[0]?.count ?? 0,
        attendance: attendanceCount[0]?.count ?? 0,
      },
    };
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get user stats');
  }
}
