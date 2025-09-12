DO $$
BEGIN
  -- Only add the constraint if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'GoogleCredentials_userId_unique'
  ) THEN
    ALTER TABLE "GoogleCredentials"
      ADD CONSTRAINT "GoogleCredentials_userId_unique" UNIQUE ("userId");
  END IF;
END $$;
