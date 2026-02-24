-- Gamification Points System Tables and RLS Policies
-- Run this migration in Supabase SQL Editor
-- Depends on: profiles, households, household_members, chores tables

-- ============================================================================
-- TABLES
-- ============================================================================

-- Point balances (denormalized for performance)
CREATE TABLE IF NOT EXISTS point_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  current_balance INTEGER NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
  total_earned INTEGER NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  total_spent INTEGER NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Point transactions (audit trail)
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL, -- positive for earned, negative for spent
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('chore_completion', 'bonus', 'undo', 'reward_redemption', 'streak_bonus')),
  reference_id UUID, -- chore_id or reward_id
  description TEXT,
  balance_after INTEGER NOT NULL, -- snapshot of balance after transaction
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks tracking
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_completion_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for point balance lookups by user
CREATE INDEX IF NOT EXISTS idx_point_balances_user_id ON point_balances(user_id);

-- Index for point balance lookups by household (leaderboard queries)
CREATE INDEX IF NOT EXISTS idx_point_balances_household_id ON point_balances(household_id);

-- Index for point transactions by user
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);

-- Index for point transactions by household
CREATE INDEX IF NOT EXISTS idx_point_transactions_household_id ON point_transactions(household_id);

-- Index for point transactions by date (for history and statistics)
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at DESC);

-- Index for point transactions by reference (for undo functionality)
CREATE INDEX IF NOT EXISTS idx_point_transactions_reference_id ON point_transactions(reference_id);

-- Index for user streaks by user
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);

-- Composite index for leaderboard queries (household + total_earned desc)
CREATE INDEX IF NOT EXISTS idx_point_balances_leaderboard ON point_balances(household_id, total_earned DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE point_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: point_balances
-- ============================================================================

-- SELECT: Users can view their own balance and balances of household members
CREATE POLICY "Users can view point balances in their household"
  ON point_balances FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can have a balance created when they join a household (handled by trigger/function)
CREATE POLICY "Users can insert their own point balance"
  ON point_balances FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Only system/functions can update balances (not direct user updates)
CREATE POLICY "Only system can update point balances"
  ON point_balances FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- RLS POLICIES: point_transactions
-- ============================================================================

-- SELECT: Users can view transactions for themselves and household members
CREATE POLICY "Users can view transactions in their household"
  ON point_transactions FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can create transactions for themselves (for chore completion)
CREATE POLICY "Users can create transactions for themselves"
  ON point_transactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- UPDATE/DELETE: No direct updates or deletes (audit trail)
CREATE POLICY "No updates to transactions"
  ON point_transactions FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No deletes to transactions"
  ON point_transactions FOR DELETE
  USING (false);

-- ============================================================================
-- RLS POLICIES: user_streaks
-- ============================================================================

-- SELECT: Users can view their own streaks
CREATE POLICY "Users can view their own streaks"
  ON user_streaks FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can create their own streak record
CREATE POLICY "Users can create their own streak"
  ON user_streaks FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own streak (handled by functions)
CREATE POLICY "Users can update their own streak"
  ON user_streaks FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Function to add points to a user
CREATE OR REPLACE FUNCTION add_points_to_user(
  p_user_id UUID,
  p_points INTEGER,
  p_transaction_type TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_household_id UUID;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_result JSON;
BEGIN
  -- Get user's household
  SELECT household_id INTO v_household_id
  FROM household_members
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_household_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Benutzer ist keinem Haushalt zugeordnet');
  END IF;

  -- Validate transaction type
  IF p_transaction_type NOT IN ('chore_completion', 'bonus', 'undo', 'reward_redemption', 'streak_bonus') THEN
    RETURN json_build_object('success', false, 'error', 'Ungueltiger Transaktionstyp');
  END IF;

  -- Get or create point balance
  SELECT current_balance INTO v_current_balance
  FROM point_balances
  WHERE user_id = p_user_id;

  IF v_current_balance IS NULL THEN
    -- Create new balance record
    INSERT INTO point_balances (user_id, household_id, current_balance, total_earned, total_spent)
    VALUES (p_user_id, v_household_id, 0, 0, 0);
    v_current_balance := 0;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance + p_points;

  -- Ensure balance doesn't go negative (allow for edge cases)
  IF v_new_balance < 0 THEN
    v_new_balance := 0;
  END IF;

  -- Update point balance
  UPDATE point_balances
  SET
    current_balance = v_new_balance,
    total_earned = CASE WHEN p_points > 0 THEN total_earned + p_points ELSE total_earned END,
    total_spent = CASE WHEN p_points < 0 THEN total_spent + ABS(p_points) ELSE total_spent END,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create transaction record
  INSERT INTO point_transactions (
    user_id,
    household_id,
    points,
    transaction_type,
    reference_id,
    description,
    balance_after,
    created_by
  )
  VALUES (
    p_user_id,
    v_household_id,
    p_points,
    p_transaction_type,
    p_reference_id,
    p_description,
    v_new_balance,
    COALESCE(p_created_by, p_user_id)
  );

  RETURN json_build_object(
    'success', true,
    'points_added', p_points,
    'new_balance', v_new_balance
  );
END;
$$;

-- Function to subtract points from a user
CREATE OR REPLACE FUNCTION subtract_points_from_user(
  p_user_id UUID,
  p_points INTEGER,
  p_transaction_type TEXT DEFAULT 'undo',
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Call add_points with negative value
  SELECT add_points_to_user(
    p_user_id,
    -ABS(p_points),
    p_transaction_type,
    p_reference_id,
    p_description,
    p_created_by
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_last_completion DATE;
  v_today DATE;
  v_streak_bonus INTEGER := 0;
BEGIN
  v_today := CURRENT_DATE;

  -- Get current streak data
  SELECT current_streak, longest_streak, last_completion_date
  INTO v_current_streak, v_longest_streak, v_last_completion
  FROM user_streaks
  WHERE user_id = p_user_id;

  IF v_last_completion IS NULL THEN
    -- First completion
    v_current_streak := 1;
  ELSIF v_last_completion = v_today - 1 THEN
    -- Consecutive day
    v_current_streak := v_current_streak + 1;
  ELSIF v_last_completion = v_today THEN
    -- Already completed today, no change
    RETURN json_build_object('success', true, 'streak', v_current_streak, 'bonus', 0);
  ELSE
    -- Streak broken
    v_current_streak := 1;
  END IF;

  -- Update longest streak
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  -- Calculate streak bonus (5 points per consecutive day, max 7 days = 35 points)
  IF v_current_streak > 1 AND v_current_streak <= 7 THEN
    v_streak_bonus := 5;
  END IF;

  -- Upsert streak record
  INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_completion_date, updated_at)
  VALUES (p_user_id, v_current_streak, v_longest_streak, v_today, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_completion_date = v_today,
    updated_at = NOW();

  RETURN json_build_object(
    'success', true,
    'streak', v_current_streak,
    'longest_streak', v_longest_streak,
    'bonus', v_streak_bonus
  );
END;
$$;

-- Function to get household leaderboard
CREATE OR REPLACE FUNCTION get_household_leaderboard(
  p_household_id UUID,
  p_period TEXT DEFAULT 'all_time'
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  current_balance INTEGER,
  total_earned INTEGER,
  rank INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH period_filter AS (
    SELECT
      pt.user_id,
      SUM(pt.points) as period_points
    FROM point_transactions pt
    WHERE pt.household_id = p_household_id
      AND CASE
        WHEN p_period = 'this_week' THEN pt.created_at >= date_trunc('week', CURRENT_DATE)
        WHEN p_period = 'this_month' THEN pt.created_at >= date_trunc('month', CURRENT_DATE)
        ELSE true
      END
    GROUP BY pt.user_id
  )
  SELECT
    pb.user_id,
    p.display_name,
    p.avatar_url,
    pb.current_balance,
    COALESCE(pf.period_points, pb.total_earned) as total_earned,
    RANK() OVER (ORDER BY COALESCE(pf.period_points, pb.total_earned) DESC) as rank
  FROM point_balances pb
  JOIN profiles p ON p.id = pb.user_id
  LEFT JOIN period_filter pf ON pf.user_id = pb.user_id
  WHERE pb.household_id = p_household_id
  ORDER BY rank;
END;
$$;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_household_id UUID;
  v_weekly_points INTEGER;
  v_monthly_points INTEGER;
  v_weekly_chores INTEGER;
  v_monthly_chores INTEGER;
  v_prev_week_points INTEGER;
  v_prev_month_points INTEGER;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  -- Get household
  SELECT household_id INTO v_household_id
  FROM household_members
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Get weekly points
  SELECT COALESCE(SUM(points), 0) INTO v_weekly_points
  FROM point_transactions
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('week', CURRENT_DATE);

  -- Get monthly points
  SELECT COALESCE(SUM(points), 0) INTO v_monthly_points
  FROM point_transactions
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', CURRENT_DATE);

  -- Get weekly chores completed
  SELECT COUNT(*)::INTEGER INTO v_weekly_chores
  FROM chore_completions
  WHERE user_id = p_user_id
    AND completed_at >= date_trunc('week', CURRENT_DATE)
    AND undone_at IS NULL;

  -- Get monthly chores completed
  SELECT COUNT(*)::INTEGER INTO v_monthly_chores
  FROM chore_completions
  WHERE user_id = p_user_id
    AND completed_at >= date_trunc('month', CURRENT_DATE)
    AND undone_at IS NULL;

  -- Get previous week points (for comparison)
  SELECT COALESCE(SUM(points), 0) INTO v_prev_week_points
  FROM point_transactions
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('week', CURRENT_DATE) - INTERVAL '1 week'
    AND created_at < date_trunc('week', CURRENT_DATE);

  -- Get previous month points (for comparison)
  SELECT COALESCE(SUM(points), 0) INTO v_prev_month_points
  FROM point_transactions
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
    AND created_at < date_trunc('month', CURRENT_DATE);

  -- Get streak info
  SELECT current_streak, longest_streak INTO v_current_streak, v_longest_streak
  FROM user_streaks
  WHERE user_id = p_user_id;

  RETURN json_build_object(
    'weekly_points', v_weekly_points,
    'monthly_points', v_monthly_points,
    'weekly_chores', v_weekly_chores,
    'monthly_chores', v_monthly_chores,
    'prev_week_points', v_prev_week_points,
    'prev_month_points', v_prev_month_points,
    'current_streak', COALESCE(v_current_streak, 0),
    'longest_streak', COALESCE(v_longest_streak, 0)
  );
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update point_balances.updated_at
DROP TRIGGER IF EXISTS update_point_balances_updated_at ON point_balances;
CREATE TRIGGER update_point_balances_updated_at
  BEFORE UPDATE ON point_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update user_streaks.updated_at
DROP TRIGGER IF EXISTS update_user_streaks_updated_at ON user_streaks;
CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON point_balances TO service_role;
GRANT ALL ON point_transactions TO service_role;
GRANT ALL ON user_streaks TO service_role;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON point_balances TO authenticated;
GRANT ALL ON point_transactions TO authenticated;
GRANT ALL ON user_streaks TO authenticated;