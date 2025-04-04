// Direct migration script that doesn't require the app to be running

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Get the database URL from environment variables
const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('POSTGRES_URL environment variable not set');
  console.error('Please set it in .env.local file');
  process.exit(1);
}

// Create a database connection pool
const pool = new Pool({
  connectionString: POSTGRES_URL,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database migration...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Check if column already exists to prevent errors
    const checkColumnSql = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'KnowledgeDocument'
        AND column_name = 'transcriptCharCount';
    `;
    
    const { rows } = await client.query(checkColumnSql);
    
    if (rows.length > 0) {
      console.log('Column "transcriptCharCount" already exists. Skipping migration.');
    } else {
      // Add the column
      console.log('Adding "transcriptCharCount" column to KnowledgeDocument table...');
      await client.query(`
        ALTER TABLE "KnowledgeDocument" 
        ADD COLUMN "transcriptCharCount" VARCHAR(50)
      `);
      console.log('Column added successfully');
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Migration completed successfully');
    
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    // Release the client back to the pool
    client.release();
    // Close the pool
    pool.end();
  }
}

// Run the migration
runMigration();
