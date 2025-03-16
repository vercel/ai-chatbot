import { config } from 'dotenv';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Load environment variables
config({
  path: '.env.local',
});

// Create an interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask yes/no questions
function askQuestion(query: string): Promise<boolean> {
  return new Promise(resolve => {
    rl.question(`${query} (y/n): `, answer => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function fixTasksTables() {
  // Validate database URL
  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL is not defined in environment variables');
    process.exit(1);
  }
  
  try {
    // Create a database connection
    const sql = postgres(process.env.POSTGRES_URL, { max: 1 });
    
    console.log('\n📊 Checking database tables...');
    
    // Check if tables exist
    const tables = ['task_project', 'task_item', 'task_label', 'task_item_label'];
    let allTablesExist = true;
    
    for (const table of tables) {
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        );
      `;
      
      if (tableExists[0].exists) {
        console.log(`✅ Table ${table} exists`);
      } else {
        console.log(`❌ Table ${table} does not exist`);
        allTablesExist = false;
      }
    }
    
    if (allTablesExist) {
      console.log('\n✅ All required tables exist. Do you want to reset them?');
      const shouldReset = await askQuestion('This will DELETE all tasks data. Are you sure?');
      
      if (shouldReset) {
        console.log('\n🗑️  Dropping existing tables...');
        
        // Drop tables in reverse order to handle dependencies
        await sql`DROP TABLE IF EXISTS task_item_label CASCADE;`;
        await sql`DROP TABLE IF EXISTS task_label CASCADE;`;
        await sql`DROP TABLE IF EXISTS task_item CASCADE;`;
        await sql`DROP TABLE IF EXISTS task_project CASCADE;`;
        
        console.log('✅ Tables dropped successfully');
        
        // Create tables again
        console.log('\n🔧 Recreating tables...');
        const sqlScript = fs.readFileSync(
          path.join(process.cwd(), 'create-tasks-tables.sql'),
          'utf8'
        );
        
        // Split the script by semicolons
        const statements = sqlScript
          .split(';')
          .filter(statement => statement.trim() !== '');
        
        // Execute each statement
        for (const statement of statements) {
          if (statement.trim() !== '') {
            await sql.unsafe(statement);
          }
        }
        
        console.log('✅ Tables recreated successfully');
      } else {
        console.log('\n⏭️  Skipping table reset');
      }
    } else {
      console.log('\n🔧 Some tables are missing. Creating all tables...');
      
      // Drop existing tables first to avoid conflicts
      await sql`DROP TABLE IF EXISTS task_item_label CASCADE;`;
      await sql`DROP TABLE IF EXISTS task_label CASCADE;`;
      await sql`DROP TABLE IF EXISTS task_item CASCADE;`;
      await sql`DROP TABLE IF EXISTS task_project CASCADE;`;
      
      // Create tables
      const sqlScript = fs.readFileSync(
        path.join(process.cwd(), 'create-tasks-tables.sql'),
        'utf8'
      );
      
      // Split the script by semicolons
      const statements = sqlScript
        .split(';')
        .filter(statement => statement.trim() !== '');
      
      // Execute each statement
      for (const statement of statements) {
        if (statement.trim() !== '') {
          try {
            await sql.unsafe(statement);
            console.log('✅ Statement executed successfully');
          } catch (err) {
            console.error('❌ Error executing statement:', statement.substring(0, 100) + '...');
            console.error(err);
          }
        }
      }
      
      console.log('✅ Tables created successfully');
    }
    
    // Close database connection
    await sql.end();
    
    // Close readline interface
    rl.close();
    
    console.log('\n🎉 Task tables setup completed!');
    console.log('You can now use the Tasks feature in the application.');
    
  } catch (err) {
    console.error('\n❌ Error fixing task tables:');
    console.error(err);
    
    // Close readline interface
    rl.close();
    
    process.exit(1);
  }
}

// Run the function
fixTasksTables();
