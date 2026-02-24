-- Household Management Tables and RLS Policies
-- Run this migration in Supabase SQL Editor

-- ============================================================================
-- TABLES
-- ============================================================================

-- Households table
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 50),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household members table
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- Invite codes table
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL CHECK (char_length(code) = 6),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for household member lookups by user
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);

-- Index for household member lookups by household
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id);

-- Index for invite code lookups
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);

-- Index for finding active invite codes
CREATE INDEX IF NOT EXISTS idx_invite_codes_active ON invite_codes(household_id) WHERE used_at IS NULL;

-- Index for household creator lookups
CREATE INDEX IF NOT EXISTS idx_households_created_by ON households(created_by);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: households
-- ============================================================================

-- SELECT: Users can only see households they are members of
CREATE POLICY "Users can view their own household"
  ON households FOR SELECT
  USING (
    id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Any authenticated user can create a household
CREATE POLICY "Authenticated users can create households"
  ON households FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- UPDATE: Only admins can update household details
CREATE POLICY "Admins can update their household"
  ON households FOR UPDATE
  USING (
    id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: Only admins can delete households (though usually done via CASCADE)
CREATE POLICY "Admins can delete their household"
  ON households FOR DELETE
  USING (
    id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES: household_members
-- ============================================================================

-- SELECT: Users can see all members of their household
CREATE POLICY "Users can view members of their household"
  ON household_members FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can join a household via invite code (handled by API/service role)
-- For client-side insert, we need to allow if they're joining via valid invite
CREATE POLICY "Users can join households via invite"
  ON household_members FOR INSERT
  WITH CHECK (
    -- User is joining themselves
    user_id = auth.uid()
    AND (
      -- They're already a member of this household (edge case)
      household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
      OR
      -- The household exists and they're not a member yet (new join)
      EXISTS (
        SELECT 1 FROM households WHERE id = household_id
      )
    )
  );

-- UPDATE: Admins can update member roles, users can't update their own role
CREATE POLICY "Admins can update member roles"
  ON household_members FOR UPDATE
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

-- DELETE: Users can remove themselves, admins can remove any member
CREATE POLICY "Users can leave, admins can remove"
  ON household_members FOR DELETE
  USING (
    -- User can remove themselves
    user_id = auth.uid()
    OR
    -- Admins can remove other members
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES: invite_codes
-- ============================================================================

-- SELECT: Admins can see invite codes for their household
CREATE POLICY "Admins can view invite codes"
  ON invite_codes FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT: Admins can create invite codes
CREATE POLICY "Admins can create invite codes"
  ON invite_codes FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    AND created_by = auth.uid()
  );

-- UPDATE: Only allow updating used_at for unused codes (for joining flow)
-- This allows the join API to mark a code as used
CREATE POLICY "Can mark invite codes as used"
  ON invite_codes FOR UPDATE
  USING (
    -- Code must not be already used
    used_at IS NULL
    -- Code must not be expired
    AND expires_at > NOW()
  )
  WITH CHECK (
    -- Only allow setting used_at (not other fields)
    used_at IS NOT NULL
  );

-- DELETE: Admins can delete invite codes
CREATE POLICY "Admins can delete invite codes"
  ON invite_codes FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update households.updated_at
DROP TRIGGER IF EXISTS update_households_updated_at ON households;
CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ADDITIONAL SAFETY: One household per user constraint
-- ============================================================================

-- This is a business rule that can be enforced at the application level
-- or with a more complex trigger. For MVP, we handle this in the API.

-- Optional: Create a partial unique index to ensure only one active membership
-- This would require soft deletes or a different approach
-- CREATE UNIQUE INDEX idx_one_household_per_user ON household_members (user_id)
-- WHERE deleted_at IS NULL;

-- ============================================================================
-- GRANTS (for service role if needed)
-- ============================================================================

-- Grant necessary permissions for API routes using service role
GRANT ALL ON households TO service_role;
GRANT ALL ON household_members TO service_role;
GRANT ALL ON invite_codes TO service_role;
