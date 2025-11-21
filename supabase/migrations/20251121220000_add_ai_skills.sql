-- Create ai_skills table for storing user custom prompts/skills
CREATE TABLE IF NOT EXISTS public.ai_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_ai_skills_user_id ON public.ai_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_skills_workspace_id ON public.ai_skills(workspace_id);

-- Enable RLS
ALTER TABLE public.ai_skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only manage their own skills
CREATE POLICY "Users can view their own skills"
  ON public.ai_skills
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own skills"
  ON public.ai_skills
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills"
  ON public.ai_skills
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skills"
  ON public.ai_skills
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_ai_skills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_skills_updated_at
  BEFORE UPDATE ON public.ai_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_skills_updated_at();
