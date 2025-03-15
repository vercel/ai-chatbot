#!/usr/bin/env tsx

/**
 * Helper script to fix database issues
 * This script checks if required tables exist and creates them if needed
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

// Load environment variables
dotenv.config({ path: '.env.local' });

const execAsync = promisify(exec);

// Initialize database client
const postgresUrl = process.env.POSTGRES_URL;
if (!postgresUrl) {
  console.error('Error: POSTGRES_URL environment variable not set.');
  process.exit(1);
}

const client = postgres(postgresUrl);
const db = drizzle(client);

async function checkDatabase() {
  console.log('Checking database connection...');
  
  try {
    const result = await db.execute(sql`SELECT current_timestamp`);
    console.log('Database connection successful:', result[0].current_timestamp);
    
    // Check for required tables
    console.log('Checking for knowledge tables...');
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tables = tablesResult.map((row: any) => row.table_name);
    console.log('Available tables:', tables.join(', '));
    
    // Check for specific tables
    const requiredTables = [
      'knowledge_document',
      'knowledge_chunk',
      'knowledge_reference',
      'user',
      'chat',
      'message',
      'vote'
    ];
    
    const missingTables = requiredTables.filter(table => !tables.includes(table));
    
    if (missingTables.length > 0) {
      console.log(`Missing tables: ${missingTables.join(', ')}`);
      console.log('Running database migrations to create missing tables...');
      
      try {
        const { stdout, stderr } = await execAsync('pnpm db:migrate');
        console.log('Migration output:');
        console.log(stdout);
        
        if (stderr) {
          console.error('Migration errors:');
          console.error(stderr);
        }
        
        // Check if the tables were created
        const afterTablesResult = await db.execute(sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `);
        
        const afterTables = afterTablesResult.map((row: any) => row.table_name);
        const stillMissingTables = requiredTables.filter(table => !afterTables.includes(table));
        
        if (stillMissingTables.length > 0) {
          console.error(`Tables still missing after migration: ${stillMissingTables.join(', ')}`);
          console.error('There might be an issue with the migration scripts. Please check the schema.ts file.');
        } else {
          console.log('All required tables have been created successfully!');
        }
      } catch (migrationError) {
        console.error('Error running migrations:', migrationError);
      }
    } else {
      console.log('All required tables exist!');
    }
    
    // Check pgvector extension
    console.log('Checking for pgvector extension...');
    const extensionResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      )
    `);
    
    const vectorExtensionExists = extensionResult[0].exists;
    
    if (!vectorExtensionExists) {
      console.log('Installing pgvector extension...');
      try {
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
        console.log('pgvector extension installed successfully.');
      } catch (extError) {
        console.error('Could not install pgvector extension:', extError);
        console.error('Vector similarity search will not work without pgvector extension.');
      }
    } else {
      console.log('pgvector extension is already installed.');
    }
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('Running database fix script...');
  await checkDatabase();
  console.log('Database check complete!');
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
