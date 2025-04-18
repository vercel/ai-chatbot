-- Create a table to store debug logs from the auth callback
CREATE TABLE IF NOT EXISTS public.callback_debug_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT now(),
  user_id UUID,
  email TEXT,
  provider_token_present BOOLEAN,
  provider_refresh_token_present BOOLEAN,
  exchange_error_message TEXT,
  save_token_error_message TEXT,
  webhook_error_message TEXT,
  notes TEXT
); 