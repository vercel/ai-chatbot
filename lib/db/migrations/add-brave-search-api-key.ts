import { sql } from 'drizzle-orm';
import { db } from '../index';

export async function addBraveSearchApiKeyToSystemSettings() {
  try {
    console.log('Adding braveSearchApiKey column to SystemSettings table...');
    
    // Check if the column already exists before trying to add it
    const checkColumnQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'SystemSettings' 
        AND column_name = 'braveSearchApiKey';
    `;
    
    const columns = await db.execute(checkColumnQuery);
    
    if (columns.length === 0) {
      // Add the column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE "SystemSettings" 
        ADD COLUMN "braveSearchApiKey" TEXT;
      `);
      console.log('Successfully added braveSearchApiKey column to SystemSettings table');
    } else {
      console.log('Column braveSearchApiKey already exists in SystemSettings table');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to add braveSearchApiKey column:', error);
    throw error;
  }
} 