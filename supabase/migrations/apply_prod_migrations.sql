-- ============================================================================
-- ChoreChamp Production Migrations - PROJ-6 & PROJ-7
-- Copy and paste this entire file into Supabase Dashboard > SQL Editor
-- Then click "Run" to execute
-- ============================================================================

-- ============================================================================
-- PART 1: REWARDS SYSTEM (PROJ-6)
-- ============================================================================

-- Rewards catalog
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  image_url TEXT,
  point_cost INTEGER NOT NULL CHECK (point_cost >= 1 AND point_cost <= 10000),
  quantity_available INTEGER CHECK (quantity_available >= 0),
  quantity_claimed INTEGER DEFAULT 0 CHECK (quantity_claimed >= 0),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Redemptions
CREATE TABLE IF NOT EXISTS redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  points_spent INTEGER NOT NULL CHECK (points_spent > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  fulfilled_at TIMESTAMPTZ,
  fulfilled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fulfillment_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for rewards
CREATE INDEX IF NOT EXISTS idx_rewards_household_id ON rewards(household_id);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_created_at ON rewards(created_at DESC);

-- Indexes for redemptions
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_household_id ON redemptions(household_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);
CREATE INDEX IF NOT EXISTS idx_redemptions_reward_id ON redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_created_at ON redemptions(created_at DESC);

-- Enable RLS
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: rewards
CREATE POLICY "Users can view rewards in their household"
  ON rewards FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can create rewards"
  ON rewards FOR INSERT
  WITH CHECK (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role = 'admin') AND created_by = auth.uid());

CREATE POLICY "Admins can update rewards"
  ON rewards FOR UPDATE
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete rewards"
  ON rewards FOR DELETE
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role = 'admin'));

-- RLS Policies: redemptions
CREATE POLICY "Users can view their own redemptions"
  ON redemptions FOR SELECT
  USING (user_id = auth.uid() OR household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can create redemptions for themselves"
  ON redemptions FOR INSERT
  WITH CHECK (user_id = auth.uid() AND household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update redemptions"
  ON redemptions FOR UPDATE
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "No deletes to redemptions"
  ON redemptions FOR DELETE USING (false);

-- Grants
GRANT ALL ON rewards TO authenticated;
GRANT ALL ON redemptions TO authenticated;

-- ============================================================================
-- PART 2: LEVELS & BADGES (PROJ-7)
-- ============================================================================

-- User levels
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
  criteria JSONB NOT NULL,
  icon TEXT NOT NULL,
  points_reward INTEGER DEFAULT 0 CHECK (points_reward >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES badge_definitions(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Badge progress
CREATE TABLE IF NOT EXISTS badge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES badge_definitions(id) ON DELETE CASCADE NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0 CHECK (current_value >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_badge_definitions_category ON badge_definitions(category);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_badge_progress_user_id ON badge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_badge_progress_badge_id ON badge_progress(badge_id);

-- Enable RLS
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies: user_levels
CREATE POLICY "Users can view levels in their household"
  ON user_levels FOR SELECT
  USING (user_id IN (SELECT user_id FROM household_members WHERE household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())) OR user_id = auth.uid());

CREATE POLICY "Users can create their own level"
  ON user_levels FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own level"
  ON user_levels FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- RLS Policies: badge_definitions
CREATE POLICY "Everyone can view badge definitions" ON badge_definitions FOR SELECT USING (true);
CREATE POLICY "Only service role can insert badge definitions" ON badge_definitions FOR INSERT WITH CHECK (false);
CREATE POLICY "Only service role can update badge definitions" ON badge_definitions FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY "Only service role can delete badge definitions" ON badge_definitions FOR DELETE USING (false);

-- RLS Policies: user_badges
CREATE POLICY "Users can view badges in their household"
  ON user_badges FOR SELECT
  USING (user_id IN (SELECT user_id FROM household_members WHERE household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())) OR user_id = auth.uid());

CREATE POLICY "Users can earn badges for themselves"
  ON user_badges FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "No updates to user badges" ON user_badges FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY "No deletes to user badges" ON user_badges FOR DELETE USING (false);

-- RLS Policies: badge_progress
CREATE POLICY "Users can view their own badge progress" ON badge_progress FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own badge progress" ON badge_progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own badge progress" ON badge_progress FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "No deletes to badge progress" ON badge_progress FOR DELETE USING (false);

-- Grants
GRANT ALL ON user_levels TO authenticated;
GRANT ALL ON badge_definitions TO authenticated;
GRANT ALL ON user_badges TO authenticated;
GRANT ALL ON badge_progress TO authenticated;

-- ============================================================================
-- PART 3: SEED BADGE DEFINITIONS
-- ============================================================================

INSERT INTO badge_definitions (name, description, category, criteria, icon, points_reward) VALUES
-- Completion badges
('First Step', 'Complete your first chore', 'completion', '{"type": "chores_completed", "value": 1}', '🎯', 5),
('Getting Started', 'Complete 10 chores', 'completion', '{"type": "chores_completed", "value": 10}', '🌟', 10),
('On a Roll', 'Complete 50 chores', 'completion', '{"type": "chores_completed", "value": 50}', '🔄', 25),
('Century', 'Complete 100 chores', 'completion', '{"type": "chores_completed", "value": 100}', '💯', 50),
('Dedicated', 'Complete 250 chores', 'completion', '{"type": "chores_completed", "value": 250}', '🏆', 100),
-- Streak badges
('Week Warrior', '7-day completion streak', 'streak', '{"type": "streak_days", "value": 7}', '🔥', 20),
('Two Week Champion', '14-day completion streak', 'streak', '{"type": "streak_days", "value": 14}', '⚡', 40),
('Monthly Master', '30-day completion streak', 'streak', '{"type": "streak_days", "value": 30}', '👑', 100),
-- Point badges
('Point Collector', 'Earn 100 points', 'points', '{"type": "total_points", "value": 100}', '💰', 10),
('Point Hunter', 'Earn 500 points', 'points', '{"type": "total_points", "value": 500}', '🎯', 25),
('Point Master', 'Earn 1000 points', 'points', '{"type": "total_points", "value": 1000}', '💎', 50)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- PART 4: USER ONBOARDING TRIGGERS (PROJ-8)
-- Automatically creates point_balances, user_levels, user_streaks on user signup
-- ============================================================================

-- Drop existing trigger (we'll recreate it enhanced)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Enhanced function to handle new user setup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      CASE WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1) ELSE 'User' END
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create point balance
  INSERT INTO public.point_balances (user_id, household_id, current_balance, total_earned, total_spent, updated_at)
  VALUES (NEW.id, NULL, 0, 0, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- Create user level
  INSERT INTO public.user_levels (user_id, current_level, total_points, updated_at)
  VALUES (NEW.id, 1, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- Create user streak
  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_completion_date, updated_at)
  VALUES (NEW.id, 0, 0, NULL, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Recreate trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Household creation handler
CREATE OR REPLACE FUNCTION public.handle_household_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.household_members (household_id, user_id, role, joined_at)
  VALUES (NEW.id, NEW.created_by, 'admin', NOW())
  ON CONFLICT (household_id, user_id) DO NOTHING;

  UPDATE public.point_balances
  SET household_id = NEW.id, updated_at = NOW()
  WHERE user_id = NEW.created_by AND household_id IS NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_household_created ON public.households;
CREATE TRIGGER on_household_created
  AFTER INSERT ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_household_creation();

-- Household join handler
CREATE OR REPLACE FUNCTION public.handle_household_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.point_balances
  SET household_id = NEW.household_id, updated_at = NOW()
  WHERE user_id = NEW.user_id AND household_id IS NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_household_member_added ON public.household_members;
CREATE TRIGGER on_household_member_added
  AFTER INSERT ON public.household_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_household_join();

-- Backfill existing users
INSERT INTO public.point_balances (user_id, household_id, current_balance, total_earned, total_spent, updated_at)
SELECT u.id, hm.household_id, 0, 0, 0, NOW()
FROM auth.users u
LEFT JOIN public.point_balances pb ON pb.user_id = u.id
LEFT JOIN public.household_members hm ON hm.user_id = u.id
WHERE pb.id IS NULL;

INSERT INTO public.user_levels (user_id, current_level, total_points, updated_at)
SELECT u.id, 1, 0, NOW()
FROM auth.users u
LEFT JOIN public.user_levels ul ON ul.user_id = u.id
WHERE ul.id IS NULL;

INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_completion_date, updated_at)
SELECT u.id, 0, 0, NULL, NOW()
FROM auth.users u
LEFT JOIN public.user_streaks us ON us.user_id = u.id
WHERE us.id IS NULL;

-- Grants
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_household_creation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_household_join() TO authenticated;

-- ============================================================================
-- DONE! Verify with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('rewards', 'redemptions', 'user_levels', 'badge_definitions', 'user_badges', 'badge_progress', 'point_balances', 'user_streaks');
-- ============================================================================
