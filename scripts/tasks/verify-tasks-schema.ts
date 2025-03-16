import { config } from 'dotenv';
import postgres from 'postgres';

// Load environment variables
config({
  path: '.env.local',
});

async function verifyTasksSchema() {
  // Validate database URL
  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL is not defined in environment variables');
    process.exit(1);
  }
  
  try {
    // Create a database connection
    const sql = postgres(process.env.POSTGRES_URL, { max: 1 });
    
    // Tables to check
    const tablesToCheck = [
      'task_project',
      'task_item',
      'task_label',
      'task_item_label'
    ];
    
    console.log('⏳ Verifying tasks schema...');
    
    // Check each table
    for (const table of tablesToCheck) {
      try {
        // Check if table exists
        const tableExists = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          );
        `;
        
        if (tableExists[0].exists) {
          console.log(`✅ Table ${table} exists`);
          
          // Get column info
          const columns = await sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = ${table};
          `;
          
          console.log(`   Columns: ${columns.length}`);
        } else {
          console.error(`❌ Table ${table} does not exist`);
        }
      } catch (err) {
        console.error(`❌ Error checking table ${table}:`);
        console.error(err);
      }
    }
    
    // Close the connection
    await sql.end();
    console.log('✅ Schema verification completed');
  } catch (err) {
    console.error('❌ Schema verification failed:');
    console.error(err);
    process.exit(1);
  }
}

// Run the verification
verifyTasksSchema();
