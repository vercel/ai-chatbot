-- Update handle_new_user to add a small delay before fetching tokens
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_data json;
  webhook_url text := 'https://n8n-naps.onrender.com/webhook/64fc6422-135f-4e81-bd23-8fc61daee99e';
  result int;
  provider_tokens_record RECORD;
  provider_token_json json;
BEGIN
  -- Attempt to insert into User_Profiles, including email
  BEGIN
      INSERT INTO public."User_Profiles" (id, email)
      VALUES (NEW.id, NEW.email);
      RAISE NOTICE 'Delayed Trigger: Inserted new user profile for % with email %', NEW.id, NEW.email;
  EXCEPTION 
      WHEN unique_violation THEN
          RAISE NOTICE 'Delayed Trigger: User profile for % already exists.', NEW.id;
      WHEN OTHERS THEN
          RAISE WARNING 'Delayed Trigger: Error inserting into User_Profiles for user %: %', NEW.id, SQLERRM;
          RAISE EXCEPTION 'Error in Delayed handle_new_user trigger (Profile Insert): %', SQLERRM;
  END;

  -- Introduce a small delay (e.g., 200 milliseconds) hoping tokens become available
  BEGIN
      RAISE NOTICE 'Delayed Trigger: Sleeping before token fetch for user %', NEW.id;
      PERFORM pg_sleep(0.2); 
      RAISE NOTICE 'Delayed Trigger: Woke up, attempting token fetch for user %', NEW.id;
  EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Delayed Trigger: Error during pg_sleep for user %: %', NEW.id, SQLERRM;
  END;

  -- Fetch the specific provider token details for the new user (assuming Google for now)
  BEGIN
    SELECT * INTO provider_tokens_record
    FROM auth.user_provider_tokens t 
    WHERE t.user_id = NEW.id AND t.provider = 'google'
    LIMIT 1;
    RAISE NOTICE 'Delayed Trigger: Fetched provider tokens for user % (Record is NULL? %)', NEW.id, (provider_tokens_record IS NULL);
  EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Delayed Trigger: Error fetching provider tokens for user %: %', NEW.id, SQLERRM;
      provider_tokens_record := NULL;
  END;

  -- Convert the record to JSON to include in the webhook payload
  IF provider_tokens_record IS NOT NULL THEN
    provider_token_json := row_to_json(provider_tokens_record);
  ELSE
    provider_token_json := 'null'::json;
  END IF;

  -- Insert/Update the public.user_provider_tokens table
  IF provider_tokens_record IS NOT NULL THEN
    BEGIN
      INSERT INTO public.user_provider_tokens (user_id, provider, email, access_token, refresh_token)
      VALUES (NEW.id, 'google', NEW.email, provider_tokens_record.access_token, provider_tokens_record.refresh_token)
      ON CONFLICT (user_id, provider) 
      DO UPDATE SET
        email = EXCLUDED.email,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        updated_at = now();
      RAISE NOTICE 'Delayed Trigger: Upserted token info into public.user_provider_tokens for %', NEW.id;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Delayed Trigger: Error upserting token info into public.user_provider_tokens for user %: %', NEW.id, SQLERRM;
    END;
  ELSE
     RAISE NOTICE 'Delayed Trigger: Skipping upsert to public.user_provider_tokens because token fetch failed or returned null for user %', NEW.id;
  END IF;

  -- Create JSON object for webhook
  user_data := json_build_object(
    'user_id', NEW.id,
    'email', NEW.email,
    'phone', NEW.phone,
    'created_at', NEW.created_at,
    'updated_at', NEW.updated_at,
    'raw_user_meta_data', NEW.raw_user_meta_data,
    'raw_app_meta_data', NEW.raw_app_meta_data,
    'provider_tokens', provider_token_json
  );

  -- Send data to webhook using pg_net extension
  BEGIN
    SELECT net.http_post(
      url := webhook_url,
      headers := '{"Content-Type": "application/json"}',
      body := user_data
    ) INTO result;
    RAISE NOTICE 'Delayed Trigger: Webhook notification sent for user %: Result %', NEW.id, result;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Delayed Trigger: Error sending webhook for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 