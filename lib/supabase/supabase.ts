// src/lib/supabase/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://zxzzofbxezeofhecawfi.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4enpvZmJ4ZXplb2ZoZWNhd2ZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMjg5MDQ0OCwiZXhwIjoyMDM4NDY2NDQ4fQ.u8knJen0dB23qldWwFmN3Wzol3Q1fdigSGZcYVapG3U";


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
