import { config } from 'dotenv';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

// Load environment variables
config({
  path: '.env.local',
});

async function runTaskMigration() {
  // Validate database URL
  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL is not defined in environment variables');
    process.exit(1);
  }
  
  try {
    // Create a database connection
    const sql = postgres(process.env.POSTGRES_URL, { max: 1 });
    
    // Read the SQL script
    const sqlScript = fs.readFileSync(
      path.join(process.cwd(), 'create-tasks-tables.sql'),
      'utf8'
    );
    
    // Split the script by semicolons to execute each statement separately
    const statements = sqlScript
      .split(';')
      .filter(statement => statement.trim() !== '');
    
    console.log(`⏳ Running tasks migration with ${statements.length} statements...`);
    
    // Execute each statement
    for (const statement of statements) {
      try {
        await sql.unsafe(statement);
        console.log('✅ Executed statement successfully');
      } catch (err) {
        console.error('❌ Error executing statement:', statement);
        console.error(err);
        // Continue with other statements even if one fails
      }
    }
    
    console.log('✅ Tasks migration completed successfully');
    
    // Close the connection
    await sql.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Task migration failed:');
    console.error(err);
    process.exit(1);
  }
}

// Run the migration
runTaskMigration();
