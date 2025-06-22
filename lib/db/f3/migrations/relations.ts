import { relations } from 'drizzle-orm/relations';
import { achievementsList, achievementsAwarded } from './schema';

export const achievementsAwardedRelations = relations(
  achievementsAwarded,
  ({ one }) => ({
    achievementsList: one(achievementsList, {
      fields: [achievementsAwarded.achievementId],
      references: [achievementsList.id],
    }),
  }),
);

export const achievementsListRelations = relations(
  achievementsList,
  ({ many }) => ({
    achievementsAwardeds: many(achievementsAwarded),
  }),
);
