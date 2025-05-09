const { sql } = require('drizzle-orm');

// Migration to add a UNIQUE constraint to the id column of the Document table

module.exports.up = async function(db) {
  // Check if the constraint already exists to make the script idempotent
  const constraintCheck = await db.execute(sql`
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'Document' AND constraint_name = 'Document_id_unique_constraint' AND constraint_type = 'UNIQUE';
  `);

  if (constraintCheck.length === 0) {
    await db.execute(sql`
      ALTER TABLE "Document"
      ADD CONSTRAINT "Document_id_unique_constraint" UNIQUE ("id");
    `);
    console.log('Migration: Added UNIQUE constraint to Document.id.');
  } else {
    console.log('Migration: UNIQUE constraint on Document.id already exists.');
  }
};

module.exports.down = async function(db) {
  // Only drop if it exists
  const constraintCheck = await db.execute(sql`
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'Document' AND constraint_name = 'Document_id_unique_constraint' AND constraint_type = 'UNIQUE';
  `);
  if (constraintCheck.length > 0) {
    await db.execute(sql`
      ALTER TABLE "Document"
      DROP CONSTRAINT IF EXISTS "Document_id_unique_constraint";
    `);
    console.log('Rollback: Dropped UNIQUE constraint from Document.id.');
  } else {
    console.log('Rollback: UNIQUE constraint on Document.id does not exist or was already dropped.');
  }
}; 