-- Create ModelSettings table for admin model management
CREATE TABLE IF NOT EXISTS "ModelSettings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "modelId" VARCHAR(100) NOT NULL UNIQUE,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "isHidden" BOOLEAN NOT NULL DEFAULT false,
  "customName" VARCHAR(100),
  "customDescription" TEXT,
  "maxTier" VARCHAR(20) CHECK ("maxTier" IN ('low', 'medium', 'high', 'premium')),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_model_settings_modelId ON "ModelSettings"("modelId");
CREATE INDEX IF NOT EXISTS idx_model_settings_enabled ON "ModelSettings"("isEnabled");
CREATE INDEX IF NOT EXISTS idx_model_settings_tier ON "ModelSettings"("maxTier");

-- Insert default settings for commonly used models (all enabled by default)
-- This is optional - models will default to enabled if no record exists