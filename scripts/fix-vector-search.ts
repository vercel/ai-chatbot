/**
 * This script fixes the vector search functionality in the knowledge base
 * It enables the pgvector extension and converts text embeddings to vector type
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { promises as fs } from 'fs';
import path from 'path';

// Load environment variables if needed
// require('dotenv').config();

async function main() {
  try {
    console.log('Starting vector search fix...');

    // Get database connection URL
    const dbUrl = process.env.POSTGRES_URL;
    if (!dbUrl) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }

    // Print status
    console.log(`Connecting to database: ${dbUrl.replace(/:[^:@]*@/, ':***@')}`);

    // Create database connection
    const client = postgres(dbUrl);
    const db = drizzle(client);

    // Read the SQL script
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'fix-vector-search.sql');
    const sqlScript = await fs.readFile(sqlFilePath, 'utf8');

    // Split the script into individual statements and execute them
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Executing ${statements.length} SQL statements...`);

    for (const statement of statements) {
      try {
        console.log(`Running: ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
        const result = await db.execute(sql.raw(statement));
        console.log('Result:', result);
      } catch (stmtError) {
        console.error('Error executing statement:', stmtError);
        console.error('Statement:', statement);
        // Continue with other statements even if one fails
      }
    }

    console.log('Vector search fix completed!');
    
    // Close the database connection
    await client.end();
  } catch (error) {
    console.error('Error fixing vector search:', error);
    process.exit(1);
  }
}

main().catch(console.error);
