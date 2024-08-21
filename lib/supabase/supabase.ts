import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient(
  'https://zxzzofbxezeofhecawfi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4enpvZmJ4ZXplb2ZoZWNhd2ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI4OTA0NDgsImV4cCI6MjAzODQ2NjQ0OH0.lTYTGeJ1ZDjoMv-fdld1MyGQGNzw8gYgyVVTgVOgwqE'
)

export default supabase
