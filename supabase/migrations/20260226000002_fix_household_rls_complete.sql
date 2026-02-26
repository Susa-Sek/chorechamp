-- Complete fix for household creation RLS issues
-- This fixes BUG-1: Household creation returns 403 Forbidden
--
-- Problem: When creating a household, two inserts happen:
-- 1. INSERT INTO households (created_by = user_id)
-- 2. INSERT INTO household_members (household_id, user_id, role = 'admin')
--
-- The RLS policies need to allow both operations for authenticated users.

-- ============================================================================
-- FIX 1: Households INSERT Policy
-- ============================================================================

-- Drop existing policies (there might be duplicates or conflicts)
DROP POLICY IF EXISTS "Authenticated users can create households" ON public.households;
DROP POLICY IF EXISTS "Users can create households" ON public.households;

-- Create clean INSERT policy for households
-- Any authenticated user can create a household if they are the creator
CREATE POLICY "Authenticated users can create households"
  ON public.households FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- ============================================================================
-- FIX 2: Household Members INSERT Policy
-- ============================================================================

-- Drop existing policies (there might be conflicts)
DROP POLICY IF EXISTS "Users can join households via invite" ON public.household_members;
DROP POLICY IF EXISTS "Users can insert themselves into household_members" ON public.household_members;

-- Create clean INSERT policy for household_members
-- A user can insert themselves as a member (for household creation and joining)
CREATE POLICY "Users can insert themselves as members"
  ON public.household_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FIX 3: Households SELECT Policy (ensure it works with new member)
-- ============================================================================

-- The SELECT policy needs to allow seeing a household after just being added
-- Current policy checks if user is in household_members, which should work
-- Let's verify and recreate if needed

DROP POLICY IF EXISTS "Users can view their own household" ON public.households;
DROP POLICY IF EXISTS "Users can view households they belong to" ON public.households;

CREATE POLICY "Users can view their households"
  ON public.households FOR SELECT
  USING (
    id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- FIX 4: Household Members SELECT Policy
-- ============================================================================

DROP POLICY IF EXISTS "Users can view members of their household" ON public.household_members;

CREATE POLICY "Users can view household members"
  ON public.household_members FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICATION: Grant permissions
-- ============================================================================

-- Ensure authenticated role has proper permissions
GRANT INSERT ON public.households TO authenticated;
GRANT SELECT ON public.households TO authenticated;
GRANT INSERT ON public.household_members TO authenticated;
GRANT SELECT ON public.household_members TO authenticated;

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- After applying this migration, household creation should work:
-- 1. User authenticates (has valid session)
-- 2. User creates household with created_by = their user_id
-- 3. RLS policy allows INSERT because auth.uid() = created_by
-- 4. User adds themselves as admin member with user_id = their user_id
-- 5. RLS policy allows INSERT because auth.uid() = user_id
-- 6. User can now SELECT the household because they're in household_members