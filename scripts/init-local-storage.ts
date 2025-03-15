#!/usr/bin/env tsx

/**
 * Script to initialize local storage directories and ensure
 * the database is properly set up for local file storage.
 */

import fs from 'fs';
import path from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Define storage directories
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(STORAGE_DIR, 'uploads');
const PROCESSED_DIR = process.env.PROCESSED_DIR || path.join(STORAGE_DIR, 'processed');
const EMBEDDINGS_DIR = process.env.EMBEDDINGS_DIR || path.join(STORAGE_DIR, 'embeddings');

// Create directories
async function createDirectories() {
  console.log('Creating storage directories...');
  
  for (const dir of [STORAGE_DIR, UPLOADS_DIR, PROCESSED_DIR, EMBEDDINGS_DIR]) {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    } else {
      console.log(`Directory already exists: ${dir}`);
    }
  }
  
  console.log('Storage directories ready.');
}

// Check database connection and setup
async function setupDatabase() {
  console.log('Checking database connection...');
  
  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    console.error('Error: POSTGRES_URL environment variable not set.');
    process.exit(1);
  }
  
  try {
    const client = postgres(postgresUrl);
    const db = drizzle(client);
    
    // Check connection
    console.log('Testing database connection...');
    const result = await db.execute(sql`SELECT current_timestamp`);
    console.log('Database connection successful:', result[0].current_timestamp);
    
    // Check if pgvector extension is installed
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
        console.warn('Could not install pgvector extension automatically. You may need administrator privileges.');
        console.warn('Warning: Vector similarity search will not work without the pgvector extension.');
        console.warn('You can install it manually by running: CREATE EXTENSION vector;');
      }
    } else {
      console.log('pgvector extension is already installed.');
    }
    
    // Check if knowledge tables exist
    console.log('Checking for knowledge tables...');
    const tablesResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'knowledge_document'
      )
    `);
    
    if (!tablesResult[0].exists) {
      console.warn('Knowledge tables do not exist. Please run database migrations:');
      console.warn('  pnpm db:migrate');
    } else {
      console.log('Knowledge tables exist.');
    }
    
    await client.end();
    console.log('Database setup complete.');
  } catch (error) {
    console.error('Database connection error:', error);
    console.error('Please check your POSTGRES_URL environment variable and ensure the database is running.');
    process.exit(1);
  }
}

// Main function
async function main() {
  console.log('=== Initializing WIZZO Local Storage ===');
  
  try {
    await createDirectories();
    await setupDatabase();
    
    // Execute the database migrations
    console.log('\nRunning database migrations...');
    try {
      console.log('Executing: pnpm db:migrate');
      // Use the child_process module to run the migration command
      const { execSync } = require('child_process');
      execSync('pnpm db:migrate', { stdio: 'inherit' });
      console.log('Database migrations completed successfully.');
    } catch (migrationError) {
      console.error('Error running migrations:', migrationError);
      console.error('Please run migrations manually using: pnpm db:migrate');
    }
    
    console.log('\n✅ Local storage system initialized successfully.');
    console.log('\nYou can now run the application with:');
    console.log('  pnpm dev');
  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }
}

// Run the script
main();
