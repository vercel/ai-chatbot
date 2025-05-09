const { sql } = require('drizzle-orm');

module.exports.up = async function(db) {
  await db.execute(sql`
    ALTER TABLE "SystemSettings"
    ADD COLUMN IF NOT EXISTS "braveSearchApiKey" TEXT;
  `);
};

module.exports.down = async function(db) {
  await db.execute(sql`
    ALTER TABLE "SystemSettings"
    DROP COLUMN IF EXISTS "braveSearchApiKey";
  `);
}; 