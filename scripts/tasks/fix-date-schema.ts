import { config } from 'dotenv';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

// Load environment variables
config({
  path: '.env.local',
});

async function fixDateSchema() {
  // Validate database URL
  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL is not defined in environment variables');
    process.exit(1);
  }
  
  try {
    // Create a database connection
    const sql = postgres(process.env.POSTGRES_URL, { max: 1 });
    
    console.log('⏳ Updating task_item table schema for better date handling...');
    
    // Check if the table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'task_item'
      );
    `;
    
    if (!tableExists[0].exists) {
      console.error('❌ task_item table does not exist');
      process.exit(1);
    }
    
    // Check current due date column type
    const columnInfo = await sql`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'task_item' 
      AND column_name = 'dueDate';
    `;
    
    if (columnInfo.length === 0) {
      console.error('❌ dueDate column not found in task_item table');
      process.exit(1);
    }
    
    console.log(`Current dueDate column type: ${columnInfo[0].data_type}`);
    
    if (columnInfo[0].data_type.toLowerCase() === 'character varying') {
      console.log('✅ dueDate column is already character varying type, no need to modify');
    } else {
      try {
        // Create a backup of existing data
        console.log('📦 Creating a backup of existing data...');
        
        // Get all tasks with due dates
        const tasksWithDueDates = await sql`
          SELECT id, "dueDate" FROM task_item 
          WHERE "dueDate" IS NOT NULL;
        `;
        
        console.log(`Found ${tasksWithDueDates.length} tasks with due dates`);
        
        // Update the column type
        console.log('🔄 Changing column type from timestamp to varchar...');
        await sql`
          ALTER TABLE task_item 
          ALTER COLUMN "dueDate" TYPE VARCHAR(50);
        `;
        
        console.log('✅ Column type changed successfully');
        
        // Update existing entries to ISO string format
        console.log('🔄 Updating existing date entries to ISO string format...');
        
        for (const task of tasksWithDueDates) {
          if (task.dueDate) {
            const isoString = new Date(task.dueDate).toISOString();
            await sql`
              UPDATE task_item 
              SET "dueDate" = ${isoString} 
              WHERE id = ${task.id};
            `;
          }
        }
        
        console.log(`✅ Updated ${tasksWithDueDates.length} task entries successfully`);
      } catch (error) {
        console.error('❌ Error updating schema:', error);
      }
    }
    
    // Close the connection
    await sql.end();
    console.log('✅ Schema update completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Schema update failed:');
    console.error(err);
    process.exit(1);
  }
}

// Run the schema fix
fixDateSchema();
