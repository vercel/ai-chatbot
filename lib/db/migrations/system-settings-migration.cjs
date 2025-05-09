const { sql } = require('drizzle-orm');

module.exports.up = async function(db) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "SystemSettings" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "allowGuestUsers" boolean NOT NULL DEFAULT true,
      "allowRegistration" boolean NOT NULL DEFAULT true,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    );
    
    INSERT INTO "SystemSettings" ("allowGuestUsers", "allowRegistration")
    SELECT true, true
    WHERE NOT EXISTS (SELECT 1 FROM "SystemSettings");
  `);
};

module.exports.down = async function(db) {
  await db.execute(sql`DROP TABLE IF EXISTS "SystemSettings";`);
}; 