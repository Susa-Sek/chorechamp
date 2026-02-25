-- Rewards System Tables and RLS Policies
-- Run this migration in Supabase SQL Editor
-- Depends on: profiles, households, household_members, point_balances tables

-- ============================================================================
-- TABLES
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

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for rewards by household
CREATE INDEX IF NOT EXISTS idx_rewards_household_id ON rewards(household_id);

-- Index for rewards by status
CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);

-- Index for rewards by created date
CREATE INDEX IF NOT EXISTS idx_rewards_created_at ON rewards(created_at DESC);

-- Index for redemptions by user
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON redemptions(user_id);

-- Index for redemptions by household
CREATE INDEX IF NOT EXISTS idx_redemptions_household_id ON redemptions(household_id);

-- Index for redemptions by status
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);

-- Index for redemptions by reward
CREATE INDEX IF NOT EXISTS idx_redemptions_reward_id ON redemptions(reward_id);

-- Index for redemptions by created date
CREATE INDEX IF NOT EXISTS idx_redemptions_created_at ON redemptions(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: rewards
-- ============================================================================

-- SELECT: Users can view rewards in their household (published rewards for members, all for admins)
CREATE POLICY "Users can view rewards in their household"
  ON rewards FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Only admins can create rewards
CREATE POLICY "Admins can create rewards"
  ON rewards FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    AND created_by = auth.uid()
  );

-- UPDATE: Only admins can update rewards
CREATE POLICY "Admins can update rewards"
  ON rewards FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: Only admins can delete rewards (with no pending redemptions - handled in API)
CREATE POLICY "Admins can delete rewards"
  ON rewards FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES: redemptions
-- ============================================================================

-- SELECT: Users can view their own redemptions, admins can view all household redemptions
CREATE POLICY "Users can view their own redemptions"
  ON redemptions FOR SELECT
  USING (
    user_id = auth.uid()
    OR household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT: Users can create redemptions for themselves
CREATE POLICY "Users can create redemptions for themselves"
  ON redemptions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Only admins can update redemptions (to fulfill them)
CREATE POLICY "Admins can update redemptions"
  ON redemptions FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: No direct deletes (for audit trail)
CREATE POLICY "No deletes to redemptions"
  ON redemptions FOR DELETE
  USING (false);

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Function to redeem a reward (handles transaction, balance check, and quantity update)
CREATE OR REPLACE FUNCTION redeem_reward(
  p_reward_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_household_id UUID;
  v_reward_household_id UUID;
  v_point_cost INTEGER;
  v_quantity_available INTEGER;
  v_quantity_claimed INTEGER;
  v_user_balance INTEGER;
  v_reward_status TEXT;
BEGIN
  -- Get user's household
  SELECT household_id INTO v_household_id
  FROM household_members
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_household_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Benutzer ist keinem Haushalt zugeordnet');
  END IF;

  -- Get reward details
  SELECT
    household_id,
    point_cost,
    quantity_available,
    quantity_claimed,
    status
  INTO
    v_reward_household_id,
    v_point_cost,
    v_quantity_available,
    v_quantity_claimed,
    v_reward_status
  FROM rewards
  WHERE id = p_reward_id;

  IF v_reward_household_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Belohnung nicht gefunden');
  END IF;

  -- Verify reward belongs to same household
  IF v_reward_household_id != v_household_id THEN
    RETURN json_build_object('success', false, 'error', 'Belohnung nicht in deinem Haushalt');
  END IF;

  -- Check reward is published
  IF v_reward_status != 'published' THEN
    RETURN json_build_object('success', false, 'error', 'Belohnung ist nicht verfuegbar');
  END IF;

  -- Check quantity if limited
  IF v_quantity_available IS NOT NULL AND v_quantity_claimed >= v_quantity_available THEN
    RETURN json_build_object('success', false, 'error', 'Belohnung ist ausverkauft');
  END IF;

  -- Get user's point balance
  SELECT current_balance INTO v_user_balance
  FROM point_balances
  WHERE user_id = p_user_id;

  IF v_user_balance IS NULL OR v_user_balance < v_point_cost THEN
    RETURN json_build_object('success', false, 'error', 'Nicht genuegend Punkte');
  END IF;

  -- Start transaction
  -- Deduct points
  UPDATE point_balances
  SET
    current_balance = current_balance - v_point_cost,
    total_spent = total_spent + v_point_cost,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create transaction record for points deduction
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
  SELECT
    p_user_id,
    v_household_id,
    -v_point_cost,
    'reward_redemption',
    p_reward_id,
    'Belohnung eingelöst',
    current_balance,
    p_user_id
  FROM point_balances
  WHERE user_id = p_user_id;

  -- Create redemption record
  INSERT INTO redemptions (
    reward_id,
    user_id,
    household_id,
    points_spent,
    status
  )
  VALUES (
    p_reward_id,
    p_user_id,
    v_household_id,
    v_point_cost,
    'pending'
  );

  -- Increment quantity claimed if limited
  IF v_quantity_available IS NOT NULL THEN
    UPDATE rewards
    SET quantity_claimed = quantity_claimed + 1
    WHERE id = p_reward_id;
  END IF;

  -- Get new balance
  SELECT current_balance INTO v_user_balance
  FROM point_balances
  WHERE user_id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'points_spent', v_point_cost,
    'new_balance', v_user_balance
  );
END;
$$;

-- Function to fulfill a redemption (admin only)
CREATE OR REPLACE FUNCTION fulfill_redemption(
  p_redemption_id UUID,
  p_admin_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_household_id UUID;
  v_redemption_user_id UUID;
  v_reward_id UUID;
  v_redemption_status TEXT;
BEGIN
  -- Get admin's household
  SELECT household_id INTO v_household_id
  FROM household_members
  WHERE user_id = p_admin_id AND role = 'admin'
  LIMIT 1;

  IF v_household_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Nur Administratoren koennen Einloesungen erfuellen');
  END IF;

  -- Get redemption details
  SELECT user_id, reward_id, status
  INTO v_redemption_user_id, v_reward_id, v_redemption_status
  FROM redemptions
  WHERE id = p_redemption_id;

  IF v_redemption_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Einloesung nicht gefunden');
  END IF;

  -- Verify redemption belongs to same household
  IF NOT EXISTS (
    SELECT 1 FROM redemptions r
    WHERE r.id = p_redemption_id
    AND r.household_id = v_household_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Einloesung nicht in deinem Haushalt');
  END IF;

  -- Check redemption is pending
  IF v_redemption_status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Einloesung ist nicht ausstehend');
  END IF;

  -- Update redemption
  UPDATE redemptions
  SET
    status = 'fulfilled',
    fulfilled_at = NOW(),
    fulfilled_by = p_admin_id,
    fulfillment_notes = p_notes
  WHERE id = p_redemption_id;

  RETURN json_build_object('success', true, 'message', 'Einloesung erfolgreich erfuellt');
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update rewards.updated_at
DROP TRIGGER IF EXISTS update_rewards_updated_at ON rewards;
CREATE TRIGGER update_rewards_updated_at
  BEFORE UPDATE ON rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON rewards TO service_role;
GRANT ALL ON redemptions TO service_role;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON rewards TO authenticated;
GRANT ALL ON redemptions TO authenticated;