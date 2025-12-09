-- Migration: Add Gamification System Tables
-- Version: 1.0
-- Date: December 6, 2025
-- Description: Add user achievements, levels, and leaderboards for gamification

-- ============================================
-- 1. USER ACHIEVEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_type VARCHAR(100) NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url TEXT,
  points_earned INTEGER DEFAULT 0,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, achievement_type)
);

CREATE INDEX idx_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_achievements_type ON user_achievements(achievement_type);
CREATE INDEX idx_achievements_unlocked_at ON user_achievements(unlocked_at DESC);

COMMENT ON TABLE user_achievements IS 'User achievements and badges';
COMMENT ON COLUMN user_achievements.achievement_type IS 'Type of achievement (first_evaluation, power_user, streak_7_days, etc.)';
COMMENT ON COLUMN user_achievements.points_earned IS 'XP points awarded for this achievement';

-- ============================================
-- 2. USER LEVELS
-- ============================================

CREATE TABLE IF NOT EXISTS user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  current_level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  xp_to_next_level INTEGER DEFAULT 100,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX idx_user_levels_total_xp ON user_levels(total_xp DESC);
CREATE INDEX idx_user_levels_current_level ON user_levels(current_level DESC);
CREATE INDEX idx_user_levels_current_streak ON user_levels(current_streak_days DESC);

COMMENT ON TABLE user_levels IS 'User experience points, levels, and streak tracking';
COMMENT ON COLUMN user_levels.xp_to_next_level IS 'XP required to reach next level (increases with each level)';
COMMENT ON COLUMN user_levels.current_streak_days IS 'Consecutive days of activity';

-- ============================================
-- 3. LEADERBOARDS
-- ============================================

CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL,
  rank INTEGER,
  period VARCHAR(50) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leaderboards_category ON leaderboards(category);
CREATE INDEX idx_leaderboards_period ON leaderboards(period);
CREATE INDEX idx_leaderboards_rank ON leaderboards(rank);
CREATE INDEX idx_leaderboards_user_category_period ON leaderboards(user_id, category, period);

COMMENT ON TABLE leaderboards IS 'Global and category-specific leaderboards';
COMMENT ON COLUMN leaderboards.category IS 'Leaderboard category (global, fan_ops, earn_hub, legal, etc.)';
COMMENT ON COLUMN leaderboards.period IS 'Time period (all_time, monthly, weekly, daily)';
COMMENT ON COLUMN leaderboards.score IS 'Leaderboard score (total XP, points earned, etc.)';

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_levels_updated_at
  BEFORE UPDATE ON user_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboards_updated_at
  BEFORE UPDATE ON leaderboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate XP required for next level
CREATE OR REPLACE FUNCTION calculate_xp_for_level(level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- XP required = 100 * (1.5 ^ (level - 1))
  -- Level 1→2: 100 XP
  -- Level 2→3: 150 XP
  -- Level 3→4: 225 XP
  -- Level 4→5: 337 XP
  -- Level 5→6: 506 XP
  RETURN FLOOR(100 * POWER(1.5, level - 1));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update user level based on XP
CREATE OR REPLACE FUNCTION update_user_level(p_user_id UUID, p_xp_gained INTEGER)
RETURNS TABLE (
  new_level INTEGER,
  total_xp INTEGER,
  leveled_up BOOLEAN
) AS $$
DECLARE
  v_current_level INTEGER;
  v_current_xp INTEGER;
  v_xp_needed INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_leveled_up BOOLEAN := false;
BEGIN
  -- Get current level and XP
  SELECT current_level, total_xp
  INTO v_current_level, v_current_xp
  FROM user_levels
  WHERE user_id = p_user_id;

  -- Initialize if user doesn't exist
  IF v_current_level IS NULL THEN
    INSERT INTO user_levels (user_id, current_level, total_xp, xp_to_next_level)
    VALUES (p_user_id, 1, 0, calculate_xp_for_level(1))
    RETURNING current_level, total_xp INTO v_current_level, v_current_xp;
  END IF;

  -- Add XP
  v_new_xp := v_current_xp + p_xp_gained;
  v_new_level := v_current_level;

  -- Check for level up(s)
  LOOP
    v_xp_needed := calculate_xp_for_level(v_new_level);
    EXIT WHEN v_new_xp < v_xp_needed;
    
    v_new_level := v_new_level + 1;
    v_leveled_up := true;
  END LOOP;

  -- Update user_levels
  UPDATE user_levels
  SET 
    total_xp = v_new_xp,
    current_level = v_new_level,
    xp_to_next_level = calculate_xp_for_level(v_new_level),
    updated_at = now()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_new_level, v_new_xp, v_leveled_up;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS TABLE (
  current_streak INTEGER,
  streak_continued BOOLEAN
) AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_streak_continued BOOLEAN := false;
BEGIN
  -- Get current streak and last activity
  SELECT last_activity_date, current_streak_days, longest_streak_days
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM user_levels
  WHERE user_id = p_user_id;

  -- Initialize if user doesn't exist
  IF v_last_activity IS NULL THEN
    INSERT INTO user_levels (user_id, last_activity_date, current_streak_days, longest_streak_days)
    VALUES (p_user_id, CURRENT_DATE, 1, 1)
    RETURNING current_streak_days, true INTO v_current_streak, v_streak_continued;
    RETURN QUERY SELECT v_current_streak, v_streak_continued;
    RETURN;
  END IF;

  -- Check if activity is today
  IF v_last_activity = CURRENT_DATE THEN
    -- Already logged activity today, no change
    RETURN QUERY SELECT v_current_streak, false;
    RETURN;
  END IF;

  -- Check if activity was yesterday (streak continues)
  IF v_last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
    v_current_streak := v_current_streak + 1;
    v_streak_continued := true;
    
    -- Update longest streak if current exceeds it
    IF v_current_streak > v_longest_streak THEN
      v_longest_streak := v_current_streak;
    END IF;
  ELSE
    -- Streak broken, reset to 1
    v_current_streak := 1;
  END IF;

  -- Update user_levels
  UPDATE user_levels
  SET 
    last_activity_date = CURRENT_DATE,
    current_streak_days = v_current_streak,
    longest_streak_days = v_longest_streak,
    updated_at = now()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_current_streak, v_streak_continued;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- Policies for user_achievements
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all achievements for leaderboard"
  ON user_achievements FOR SELECT
  USING (true);

CREATE POLICY "System can insert achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (true);

-- Policies for user_levels
CREATE POLICY "Users can view own level"
  ON user_levels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all levels for leaderboard"
  ON user_levels FOR SELECT
  USING (true);

CREATE POLICY "System can manage levels"
  ON user_levels FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policies for leaderboards
CREATE POLICY "Everyone can view leaderboards"
  ON leaderboards FOR SELECT
  USING (true);

CREATE POLICY "System can manage leaderboards"
  ON leaderboards FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- SEED DATA (Example Achievements)
-- ============================================

-- Achievement definitions (would be in a separate achievements table in production)
INSERT INTO user_achievements (user_id, achievement_type, achievement_name, description, icon_url, points_earned)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'first_evaluation', 'First Steps', 'Complete your first evaluation', '/icons/achievements/first_steps.svg', 10),
  ('00000000-0000-0000-0000-000000000000', 'streak_7_days', 'Week Warrior', 'Maintain a 7-day streak', '/icons/achievements/week_warrior.svg', 50),
  ('00000000-0000-0000-0000-000000000000', 'streak_30_days', 'Monthly Master', 'Maintain a 30-day streak', '/icons/achievements/monthly_master.svg', 200),
  ('00000000-0000-0000-0000-000000000000', 'level_10', 'Rising Star', 'Reach level 10', '/icons/achievements/rising_star.svg', 100),
  ('00000000-0000-0000-0000-000000000000', 'level_25', 'Elite User', 'Reach level 25', '/icons/achievements/elite_user.svg', 250),
  ('00000000-0000-0000-0000-000000000000', 'power_user', 'Power User', 'Use 5 different modules', '/icons/achievements/power_user.svg', 75)
ON CONFLICT (user_id, achievement_type) DO NOTHING;

COMMENT ON TABLE user_achievements IS 'Row with user_id = 00000000-0000-0000-0000-000000000000 represents achievement definitions';
