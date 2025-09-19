import { createClient } from '@supabase/supabase-js';

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Load environment variables from .env.local file
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env.local' });
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials. Please create a .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection by querying the User table
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      return false;
    }
    
    console.log('Successfully connected to Supabase!');
    console.log('Sample data:', data);
    return true;
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    return false;
  }
}

// Execute the test function
testSupabaseConnection()
  .then((success) => {
    if (success) {
      console.log('Supabase connection test completed successfully.');
    } else {
      console.error('Supabase connection test failed.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Unexpected error during Supabase connection test:', error);
    process.exit(1);
  });