-- Levels & Badges System Tables and RLS Policies
-- Run this migration in Supabase SQL Editor
-- Depends on: profiles, households, household_members, point_balances, chore_completions tables

-- ============================================================================
-- TABLES
-- ============================================================================

-- User levels (denormalized for quick access)
CREATE TABLE IF NOT EXISTS user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_level INTEGER NOT NULL DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 10),
  total_points INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badge definitions
CREATE TABLE IF NOT EXISTS badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('completion', 'streak', 'points', 'special')),
  criteria JSONB NOT NULL, -- {"type": "chores_completed", "value": 10}
  icon TEXT NOT NULL,
  points_reward INTEGER DEFAULT 0 CHECK (points_reward >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges (earned badges)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES badge_definitions(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Badge progress (for badges in progress)
CREATE TABLE IF NOT EXISTS badge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES badge_definitions(id) ON DELETE CASCADE NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0 CHECK (current_value >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for user levels lookups by user
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);

-- Index for badge definitions by category
CREATE INDEX IF NOT EXISTS idx_badge_definitions_category ON badge_definitions(category);

-- Index for user badges by user
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- Index for user badges by badge
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- Index for badge progress by user
CREATE INDEX IF NOT EXISTS idx_badge_progress_user_id ON badge_progress(user_id);

-- Index for badge progress by badge
CREATE INDEX IF NOT EXISTS idx_badge_progress_badge_id ON badge_progress(badge_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_progress ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: user_levels
-- ============================================================================

-- SELECT: Users can view their own level and levels of household members
CREATE POLICY "Users can view levels in their household"
  ON user_levels FOR SELECT
  USING (
    user_id IN (
      SELECT user_id FROM household_members
      WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
    OR user_id = auth.uid()
  );

-- INSERT: Users can create their own level record
CREATE POLICY "Users can create their own level"
  ON user_levels FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own level (handled by triggers/functions)
CREATE POLICY "Users can update their own level"
  ON user_levels FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: badge_definitions
-- ============================================================================

-- SELECT: Everyone can view badge definitions (they're public)
CREATE POLICY "Everyone can view badge definitions"
  ON badge_definitions FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE: Only service role can modify badge definitions
CREATE POLICY "Only service role can insert badge definitions"
  ON badge_definitions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Only service role can update badge definitions"
  ON badge_definitions FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Only service role can delete badge definitions"
  ON badge_definitions FOR DELETE
  USING (false);

-- ============================================================================
-- RLS POLICIES: user_badges
-- ============================================================================

-- SELECT: Users can view their own badges and badges of household members
CREATE POLICY "Users can view badges in their household"
  ON user_badges FOR SELECT
  USING (
    user_id IN (
      SELECT user_id FROM household_members
      WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
    OR user_id = auth.uid()
  );

-- INSERT: Users can earn badges for themselves (handled by functions)
CREATE POLICY "Users can earn badges for themselves"
  ON user_badges FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE/DELETE: No direct updates or deletes
CREATE POLICY "No updates to user badges"
  ON user_badges FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No deletes to user badges"
  ON user_badges FOR DELETE
  USING (false);

-- ============================================================================
-- RLS POLICIES: badge_progress
-- ============================================================================

-- SELECT: Users can view their own badge progress
CREATE POLICY "Users can view their own badge progress"
  ON badge_progress FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can create their own badge progress
CREATE POLICY "Users can create their own badge progress"
  ON badge_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own badge progress
CREATE POLICY "Users can update their own badge progress"
  ON badge_progress FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: No direct deletes
CREATE POLICY "No deletes to badge progress"
  ON badge_progress FOR DELETE
  USING (false);

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Function to calculate level from points
CREATE OR REPLACE FUNCTION calculate_level_from_points(p_points INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_level INTEGER := 1;
BEGIN
  -- Level requirements: 0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000
  IF p_points >= 10000 THEN v_level := 10;
  ELSIF p_points >= 6000 THEN v_level := 9;
  ELSIF p_points >= 4000 THEN v_level := 8;
  ELSIF p_points >= 2500 THEN v_level := 7;
  ELSIF p_points >= 1500 THEN v_level := 6;
  ELSIF p_points >= 1000 THEN v_level := 5;
  ELSIF p_points >= 600 THEN v_level := 4;
  ELSIF p_points >= 300 THEN v_level := 3;
  ELSIF p_points >= 100 THEN v_level := 2;
  ELSE v_level := 1;
  END IF;

  RETURN v_level;
END;
$$;

-- Function to get or create user level
CREATE OR REPLACE FUNCTION get_or_create_user_level(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_level RECORD;
  v_total_points INTEGER;
  v_household_id UUID;
BEGIN
  -- Check user has a household
  SELECT household_id INTO v_household_id
  FROM household_members
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_household_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Benutzer ist keinem Haushalt zugeordnet');
  END IF;

  -- Get total points from point_balances
  SELECT COALESCE(total_earned, 0) INTO v_total_points
  FROM point_balances
  WHERE user_id = p_user_id;

  IF v_total_points IS NULL THEN
    v_total_points := 0;
  END IF;

  -- Get or create user level
  INSERT INTO user_levels (user_id, current_level, total_points)
  VALUES (p_user_id, calculate_level_from_points(v_total_points), v_total_points)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_points = v_total_points,
    current_level = calculate_level_from_points(v_total_points),
    updated_at = NOW()
  RETURNING * INTO v_level;

  RETURN json_build_object(
    'success', true,
    'level', json_build_object(
      'id', v_level.id,
      'userId', v_level.user_id,
      'currentLevel', v_level.current_level,
      'totalPoints', v_level.total_points,
      'updatedAt', v_level.updated_at
    )
  );
END;
$$;

-- Function to update badge progress
CREATE OR REPLACE FUNCTION update_badge_progress(
  p_user_id UUID,
  p_badge_id UUID,
  p_new_value INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_progress RECORD;
  v_badge RECORD;
  v_criteria JSONB;
  v_target_value INTEGER;
BEGIN
  -- Get badge definition
  SELECT * INTO v_badge FROM badge_definitions WHERE id = p_badge_id;

  IF v_badge IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Abzeichen nicht gefunden');
  END IF;

  v_criteria := v_badge.criteria::JSONB;
  v_target_value := (v_criteria->>'value')::INTEGER;

  -- Check if badge already earned
  IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = p_badge_id) THEN
    RETURN json_build_object('success', true, 'message', 'Abzeichen bereits verdient');
  END IF;

  -- Update or create progress
  INSERT INTO badge_progress (user_id, badge_id, current_value)
  VALUES (p_user_id, p_badge_id, p_new_value)
  ON CONFLICT (user_id, badge_id)
  DO UPDATE SET
    current_value = p_new_value,
    updated_at = NOW()
  RETURNING * INTO v_progress;

  -- Check if badge should be awarded
  IF p_new_value >= v_target_value THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, p_badge_id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;

    -- Award bonus points if applicable
    IF v_badge.points_reward > 0 THEN
      PERFORM add_points_to_user(
        p_user_id,
        v_badge.points_reward,
        'bonus',
        p_badge_id,
        'Bonus fuer Abzeichen: ' || v_badge.name
      );
    END IF;

    RETURN json_build_object(
      'success', true,
      'badge_earned', true,
      'badge_name', v_badge.name,
      'points_reward', v_badge.points_reward
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'badge_earned', false,
    'current_progress', p_new_value,
    'target', v_target_value
  );
END;
$$;

-- Function to check all badges for a user
CREATE OR REPLACE FUNCTION check_all_badges_for_user(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_points INTEGER;
  v_chores_completed INTEGER;
  v_current_streak INTEGER;
  v_badge RECORD;
  v_new_badges TEXT[] := ARRAY[]::TEXT[];
  v_result JSON;
BEGIN
  -- Get user stats
  SELECT COALESCE(total_earned, 0) INTO v_total_points
  FROM point_balances WHERE user_id = p_user_id;

  SELECT COUNT(*)::INTEGER INTO v_chores_completed
  FROM chore_completions WHERE user_id = p_user_id AND undone_at IS NULL;

  SELECT COALESCE(current_streak, 0) INTO v_current_streak
  FROM user_streaks WHERE user_id = p_user_id;

  -- Check completion badges
  FOR v_badge IN
    SELECT * FROM badge_definitions
    WHERE category = 'completion'
    AND criteria->>'type' = 'chores_completed'
    ORDER BY (criteria->>'value')::INTEGER ASC
  LOOP
    v_result := update_badge_progress(p_user_id, v_badge.id, v_chores_completed);
    IF (v_result->>'badge_earned')::BOOLEAN THEN
      v_new_badges := array_append(v_new_badges, v_badge.name);
    END IF;
  END LOOP;

  -- Check streak badges
  FOR v_badge IN
    SELECT * FROM badge_definitions
    WHERE category = 'streak'
    AND criteria->>'type' = 'streak_days'
    ORDER BY (criteria->>'value')::INTEGER ASC
  LOOP
    v_result := update_badge_progress(p_user_id, v_badge.id, v_current_streak);
    IF (v_result->>'badge_earned')::BOOLEAN THEN
      v_new_badges := array_append(v_new_badges, v_badge.name);
    END IF;
  END LOOP;

  -- Check point badges
  FOR v_badge IN
    SELECT * FROM badge_definitions
    WHERE category = 'points'
    AND criteria->>'type' = 'total_points'
    ORDER BY (criteria->>'value')::INTEGER ASC
  LOOP
    v_result := update_badge_progress(p_user_id, v_badge.id, v_total_points);
    IF (v_result->>'badge_earned')::BOOLEAN THEN
      v_new_badges := array_append(v_new_badges, v_badge.name);
    END IF;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'new_badges', v_new_badges,
    'total_points', v_total_points,
    'chores_completed', v_chores_completed,
    'current_streak', v_current_streak
  );
END;
$$;

-- Function to get user profile with level and badges
CREATE OR REPLACE FUNCTION get_user_profile(
  p_user_id UUID,
  p_viewer_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
  v_level RECORD;
  v_chores_completed INTEGER;
  v_badges JSON;
BEGIN
  -- Get profile
  SELECT id, display_name, avatar_url, created_at INTO v_profile
  FROM profiles WHERE id = p_user_id;

  IF v_profile IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Profil nicht gefunden');
  END IF;

  -- Get level
  SELECT current_level, total_points INTO v_level
  FROM user_levels WHERE user_id = p_user_id;

  IF v_level IS NULL THEN
    -- Calculate from point_balances if no level record
    SELECT COALESCE(total_earned, 0) INTO v_level.total_points
    FROM point_balances WHERE user_id = p_user_id;
    v_level.current_level := calculate_level_from_points(COALESCE(v_level.total_points, 0));
  END IF;

  -- Get chores completed
  SELECT COUNT(*)::INTEGER INTO v_chores_completed
  FROM chore_completions
  WHERE user_id = p_user_id AND undone_at IS NULL;

  -- Get earned badges
  SELECT json_agg(
    json_build_object(
      'id', ub.id,
      'userId', ub.user_id,
      'badgeId', ub.badge_id,
      'earnedAt', ub.earned_at,
      'badge', json_build_object(
        'id', bd.id,
        'name', bd.name,
        'description', bd.description,
        'category', bd.category,
        'icon', bd.icon,
        'pointsReward', bd.points_reward
      )
    )
    ORDER BY ub.earned_at DESC
  ) INTO v_badges
  FROM user_badges ub
  JOIN badge_definitions bd ON bd.id = ub.badge_id
  WHERE ub.user_id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'profile', json_build_object(
      'userId', v_profile.id,
      'displayName', v_profile.display_name,
      'avatarUrl', v_profile.avatar_url,
      'currentLevel', v_level.current_level,
      'totalPoints', COALESCE(v_level.total_points, 0),
      'totalChoresCompleted', v_chores_completed,
      'memberSince', v_profile.created_at,
      'badges', COALESCE(v_badges, '[]'::JSON)
    )
  );
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update user_levels.updated_at
DROP TRIGGER IF EXISTS update_user_levels_updated_at ON user_levels;
CREATE TRIGGER update_user_levels_updated_at
  BEFORE UPDATE ON user_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update badge_progress.updated_at
DROP TRIGGER IF EXISTS update_badge_progress_updated_at ON badge_progress;
CREATE TRIGGER update_badge_progress_updated_at
  BEFORE UPDATE ON badge_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: Badge definitions
-- ============================================================================

-- Insert badge definitions (if not exists)
INSERT INTO badge_definitions (name, description, category, criteria, icon, points_reward)
VALUES
  -- Completion badges
  ('First Step', 'Schliesse deine erste Aufgabe ab', 'completion', '{"type": "chores_completed", "value": 1}', '🎯', 5),
  ('Getting Started', 'Schliesse 10 Aufgaben ab', 'completion', '{"type": "chores_completed", "value": 10}', '🌟', 10),
  ('On a Roll', 'Schliesse 50 Aufgaben ab', 'completion', '{"type": "chores_completed", "value": 50}', '🔄', 25),
  ('Century', 'Schliesse 100 Aufgaben ab', 'completion', '{"type": "chores_completed", "value": 100}', '💯', 50),
  ('Dedicated', 'Schliesse 250 Aufgaben ab', 'completion', '{"type": "chores_completed", "value": 250}', '🏆', 100),
  -- Streak badges
  ('Week Warrior', '7-Tage Serie', 'streak', '{"type": "streak_days", "value": 7}', '🔥', 15),
  ('Two Week Champion', '14-Tage Serie', 'streak', '{"type": "streak_days", "value": 14}', '⚡', 30),
  ('Monthly Master', '30-Tage Serie', 'streak', '{"type": "streak_days", "value": 30}', '👑', 75),
  ('Unstoppable', '60-Tage Serie', 'streak', '{"type": "streak_days", "value": 60}', '🚀', 150),
  ('Legend', '100-Tage Serie', 'streak', '{"type": "streak_days", "value": 100}', '🌈', 300),
  -- Point badges
  ('Point Collector', 'Verdiene 100 Punkte', 'points', '{"type": "total_points", "value": 100}', '💰', 10),
  ('Point Hunter', 'Verdiene 500 Punkte', 'points', '{"type": "total_points", "value": 500}', '🎯', 25),
  ('Point Master', 'Verdiene 1000 Punkte', 'points', '{"type": "total_points", "value": 1000}', '💎', 50),
  ('Point Legend', 'Verdiene 5000 Punkte', 'points', '{"type": "total_points", "value": 5000}', '👑', 200)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON user_levels TO service_role;
GRANT ALL ON badge_definitions TO service_role;
GRANT ALL ON user_badges TO service_role;
GRANT ALL ON badge_progress TO service_role;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_levels TO authenticated;
GRANT ALL ON badge_definitions TO authenticated;
GRANT ALL ON user_badges TO authenticated;
GRANT ALL ON badge_progress TO authenticated;