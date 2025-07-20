-- Insert Google credentials for user (placeholder - actual credentials should be set via environment variables)
INSERT INTO "GoogleCredentials" ("userId", "refreshToken", "accessToken", "expiresAt", "createdAt", "updatedAt")
VALUES (
  '30e83023-37a3-4f58-a2bf-ed14332958be',
  'PLACEHOLDER_REFRESH_TOKEN', -- Replace with actual refresh token via environment variables
  'PLACEHOLDER_ACCESS_TOKEN',  -- Replace with actual access token via environment variables
  '2025-07-19T22:20:52.485Z',
  NOW(),
  NOW()
)
ON CONFLICT ("userId") DO UPDATE SET
  "refreshToken" = EXCLUDED."refreshToken",
  "accessToken" = EXCLUDED."accessToken", 
  "expiresAt" = EXCLUDED."expiresAt",
  "updatedAt" = NOW(); 