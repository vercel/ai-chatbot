#!/usr/bin/env tsx

/**
 * This script diagnoses the database schema and column names
 * to help identify casing mismatches between code and database
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize database client
const postgresUrl = process.env.POSTGRES_URL;
if (!postgresUrl) {
  console.error('Error: POSTGRES_URL environment variable not set.');
  process.exit(1);
}

const client = postgres(postgresUrl);
const db = drizzle(client);

async function diagnoseSchema() {
  try {
    console.log('Connecting to database...');
    const result = await db.execute(sql`SELECT current_database()`);
    console.log(`Connected to database: ${result[0].current_database}`);
    
    // Get all tables
    console.log('\nListing all tables:');
    const tables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Tables in database:');
    tables.forEach((row: any) => {
      console.log(`- ${row.table_name}`);
    });
    
    // For each table, get column information
    console.log('\nDetailed table information:');
    for (const table of tables) {
      const tableName = (table as any).table_name;
      console.log(`\nTable: ${tableName}`);
      
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ${tableName}
        ORDER BY ordinal_position
      `);
      
      console.log('Columns:');
      columns.forEach((col: any) => {
        console.log(`- ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });
      
      // Count rows
      const countResult = await db.execute(sql`
        SELECT COUNT(*) FROM "${tableName}"
      `);
      
      console.log(`Row count: ${countResult[0].count}`);
    }
    
    // Specifically check knowledge tables
    console.log('\nChecking knowledge tables...');
    
    // Test all possible naming conventions
    const possibleTableNames = [
      'KnowledgeChunk', 'knowledge_chunk', 'knowledgechunk', 'Knowledge_Chunk',
      'KnowledgeDocument', 'knowledge_document', 'knowledgedocument', 'Knowledge_Document'
    ];
    
    for (const tableName of possibleTableNames) {
      try {
        const countResult = await db.execute(sql`
          SELECT COUNT(*) FROM "${tableName}"
        `);
        console.log(`Table "${tableName}" exists with ${countResult[0].count} rows`);
      } catch (error: any) {
        console.log(`Table "${tableName}" does not exist or cannot be accessed`);
      }
    }
  } catch (error) {
    console.error('Error diagnosing schema:', error);
  } finally {
    await client.end();
    console.log('\nDiagnostic complete');
  }
}

diagnoseSchema().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
