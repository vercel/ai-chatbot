import {
  mysqlTable,
  primaryKey,
  int,
  varchar,
  date,
  datetime,
  tinyint,
  longtext,
  index,
  json,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const achievementsAwarded = mysqlTable(
  'achievements_awarded',
  {
    id: int().autoincrement().notNull(),
    achievementId: int('achievement_id')
      .notNull()
      .references(() => achievementsList.id),
    paxId: varchar('pax_id', { length: 255 }).notNull(),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    dateAwarded: date('date_awarded', { mode: 'string' }).notNull(),
    created: datetime({ mode: 'string' })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updated: datetime({ mode: 'string' })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => {
    return {
      achievementsAwardedId: primaryKey({
        columns: [table.id],
        name: 'achievements_awarded_id',
      }),
    };
  },
);

export const achievementsList = mysqlTable(
  'achievements_list',
  {
    id: int().autoincrement().notNull(),
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 255 }).notNull(),
    verb: varchar({ length: 255 }).notNull(),
    code: varchar({ length: 255 }).notNull(),
  },
  (table) => {
    return {
      achievementsListId: primaryKey({
        columns: [table.id],
        name: 'achievements_list_id',
      }),
    };
  },
);

export const achievementsView = mysqlTable('achievements_view', {
  pax: varchar({ length: 45 }).notNull(),
  paxId: varchar('pax_id', { length: 45 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 255 }).notNull(),
  // you can use { mode: 'date' }, if you want to have Date as type for this column
  dateAwarded: date('date_awarded', { mode: 'string' }).notNull(),
});

export const aos = mysqlTable(
  'aos',
  {
    channelId: varchar('channel_id', { length: 45 }).notNull(),
    ao: varchar({ length: 45 }).notNull(),
    channelCreated: int('channel_created').notNull(),
    archived: tinyint().notNull(),
    backblast: tinyint(),
    siteQUserId: varchar('site_q_user_id', { length: 45 }),
  },
  (table) => {
    return {
      aosChannelId: primaryKey({
        columns: [table.channelId],
        name: 'aos_channel_id',
      }),
    };
  },
);

export const attendanceView = mysqlTable('attendance_view', {
  date: varchar('Date', { length: 45 }).notNull(),
  ao: varchar('AO', { length: 45 }),
  pax: varchar('PAX', { length: 45 }),
  q: varchar('Q', { length: 45 }),
});

export const backblast = mysqlTable('backblast', {
  // you can use { mode: 'date' }, if you want to have Date as type for this column
  date: date('Date', { mode: 'string' }).notNull(),
  ao: varchar('AO', { length: 45 }),
  q: varchar('Q', { length: 45 }).notNull(),
  coQ: varchar('CoQ', { length: 45 }),
  paxCount: int('pax_count'),
  fngs: varchar({ length: 45 }),
  fngCount: int('fng_count'),
  backblast: longtext(),
});

export const bdAttendance = mysqlTable(
  'bd_attendance',
  {
    timestamp: varchar({ length: 45 }),
    tsEdited: varchar('ts_edited', { length: 45 }),
    userId: varchar('user_id', { length: 45 }).notNull(),
    aoId: varchar('ao_id', { length: 45 }).notNull(),
    date: varchar({ length: 45 }).notNull(),
    qUserId: varchar('q_user_id', { length: 45 }).notNull(),
    json: json(),
  },
  (table) => {
    return {
      fkBdAttendanceAos1Idx: index('fk_bd_attendance_aos1_idx').on(table.aoId),
      bdAttendanceQUserIdUserIdAoIdDate: primaryKey({
        columns: [table.qUserId, table.userId, table.aoId, table.date],
        name: 'bd_attendance_q_user_id_user_id_ao_id_date',
      }),
    };
  },
);

export const beatdownInfo = mysqlTable('beatdown_info', {
  // you can use { mode: 'date' }, if you want to have Date as type for this column
  date: date('Date', { mode: 'string' }).notNull(),
  ao: varchar('AO', { length: 45 }),
  q: varchar('Q', { length: 45 }),
  qIsApp: tinyint('Q_Is_App').default(0),
  coQ: varchar('CoQ', { length: 45 }),
  paxCount: int('pax_count'),
  fngs: varchar({ length: 45 }),
  fngCount: int('fng_count'),
});

export const beatdowns = mysqlTable(
  'beatdowns',
  {
    timestamp: varchar({ length: 45 }),
    tsEdited: varchar('ts_edited', { length: 45 }),
    aoId: varchar('ao_id', { length: 45 }).notNull(),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    bdDate: date('bd_date', { mode: 'string' }).notNull(),
    qUserId: varchar('q_user_id', { length: 45 }).notNull(),
    coqUserId: varchar('coq_user_id', { length: 45 }),
    paxCount: int('pax_count'),
    backblast: longtext(),
    backblastParsed: longtext('backblast_parsed'),
    fngs: varchar({ length: 45 }),
    fngCount: int('fng_count'),
    json: json(),
  },
  (table) => {
    return {
      fkBeatdownsUsers1Idx: index('fk_beatdowns_users1_idx').on(table.qUserId),
      beatdownsAoIdBdDateQUserId: primaryKey({
        columns: [table.aoId, table.bdDate, table.qUserId],
        name: 'beatdowns_ao_id_bd_date_q_user_id',
      }),
    };
  },
);

export const users = mysqlTable(
  'users',
  {
    userId: varchar('user_id', { length: 45 }).notNull(),
    userName: varchar('user_name', { length: 45 }).notNull(),
    realName: varchar('real_name', { length: 45 }).notNull(),
    phone: varchar({ length: 45 }),
    email: varchar({ length: 45 }),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    startDate: date('start_date', { mode: 'string' }),
    app: tinyint().default(0).notNull(),
    json: json(),
  },
  (table) => {
    return {
      usersUserId: primaryKey({
        columns: [table.userId],
        name: 'users_user_id',
      }),
    };
  },
);
