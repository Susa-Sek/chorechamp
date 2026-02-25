-- ============================================================================
-- PROJ-8: Database Triggers for User Onboarding
-- Automatically creates point_balances, user_levels, user_streaks on user signup
-- Handles household creation and join events
-- ============================================================================

-- ============================================================================
-- SCHEMA MODIFICATION: Allow NULL household_id for new users
-- This is required because new users don't have a household yet
-- ============================================================================

-- Modify point_balances to allow NULL household_id
-- New users start without a household, household_id is set when they join/create one
ALTER TABLE public.point_balances ALTER COLUMN household_id DROP NOT NULL;

-- ============================================================================
-- ENHANCED USER CREATION TRIGGER
-- ============================================================================

-- Drop existing trigger first (we'll recreate it enhanced)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Enhanced function to handle new user setup
-- Creates: profiles, point_balances, user_levels, user_streaks
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile (with error handling for idempotency)
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      CASE
        WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1)
        ELSE 'User'
      END
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create point balance (household_id will be NULL until user joins/creates household)
  INSERT INTO public.point_balances (user_id, household_id, current_balance, total_earned, total_spent, updated_at)
  VALUES (NEW.id, NULL, 0, 0, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- Create user level (level 1, 0 XP)
  INSERT INTO public.user_levels (user_id, current_level, total_points, updated_at)
  VALUES (NEW.id, 1, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- Create user streak (0 streak)
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

-- ============================================================================
-- HOUSEHOLD CREATION TRIGGER
-- ============================================================================

-- Function to handle household creation
-- Creates household_members record with admin role
-- Updates user's point_balances and user_levels with household_id
CREATE OR REPLACE FUNCTION public.handle_household_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add creator as admin member
  INSERT INTO public.household_members (household_id, user_id, role, joined_at)
  VALUES (NEW.id, NEW.created_by, 'admin', NOW())
  ON CONFLICT (household_id, user_id) DO NOTHING;

  -- Update creator's point_balances household_id
  UPDATE public.point_balances
  SET household_id = NEW.id, updated_at = NOW()
  WHERE user_id = NEW.created_by AND household_id IS NULL;

  -- Update creator's user_levels with household_id (if column exists)
  -- Note: user_levels doesn't have household_id column in current schema
  -- This is prepared for future schema enhancement
  -- UPDATE public.user_levels
  -- SET household_id = NEW.id, updated_at = NOW()
  -- WHERE user_id = NEW.created_by;

  RETURN NEW;
END;
$$;

-- Trigger on households table
DROP TRIGGER IF EXISTS on_household_created ON public.households;
CREATE TRIGGER on_household_created
  AFTER INSERT ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_household_creation();

-- ============================================================================
-- HOUSEHOLD JOIN TRIGGER
-- ============================================================================

-- Function to handle household member join
-- Updates user's point_balances and user_levels with household_id
CREATE OR REPLACE FUNCTION public.handle_household_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update user's point_balances household_id
  UPDATE public.point_balances
  SET household_id = NEW.household_id, updated_at = NOW()
  WHERE user_id = NEW.user_id AND household_id IS NULL;

  -- Update user's user_levels with household_id (if column exists)
  -- Note: user_levels doesn't have household_id column in current schema
  -- This is prepared for future schema enhancement
  -- UPDATE public.user_levels
  -- SET household_id = NEW.household_id, updated_at = NOW()
  -- WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- Trigger on household_members table
DROP TRIGGER IF EXISTS on_household_member_added ON public.household_members;
CREATE TRIGGER on_household_member_added
  AFTER INSERT ON public.household_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_household_join();

-- ============================================================================
-- BACKFILL SCRIPT FOR EXISTING USERS
-- Note: household_id can now be NULL for users without a household
-- ============================================================================

-- Backfill point_balances for existing users without records
-- household_id will be NULL for users without a household, updated when they join/create one
INSERT INTO public.point_balances (user_id, household_id, current_balance, total_earned, total_spent, updated_at)
SELECT
  u.id,
  hm.household_id,  -- Can be NULL if user has no household
  0, 0, 0, NOW()
FROM auth.users u
LEFT JOIN public.point_balances pb ON pb.user_id = u.id
LEFT JOIN public.household_members hm ON hm.user_id = u.id
WHERE pb.id IS NULL;

-- Backfill user_levels for existing users without records
INSERT INTO public.user_levels (user_id, current_level, total_points, updated_at)
SELECT
  u.id,
  1, 0, NOW()
FROM auth.users u
LEFT JOIN public.user_levels ul ON ul.user_id = u.id
WHERE ul.id IS NULL;

-- Backfill user_streaks for existing users without records
INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_completion_date, updated_at)
SELECT
  u.id,
  0, 0, NULL, NOW()
FROM auth.users u
LEFT JOIN public.user_streaks us ON us.user_id = u.id
WHERE us.id IS NULL;

-- ============================================================================
-- FIX RLS POLICIES FOR TRIGGER-CREATED RECORDS
-- ============================================================================

-- The RLS policies for INSERT on point_balances and user_streaks allow user_id = auth.uid()
-- Since triggers run as SECURITY DEFINER, they bypass RLS
-- No changes needed to RLS policies

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_household_creation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_household_join() TO authenticated;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS
'Automatically creates profile, point_balances, user_levels, and user_streaks records when a new user signs up. Runs as SECURITY DEFINER to bypass RLS.';

COMMENT ON FUNCTION public.handle_household_creation() IS
'Automatically adds the household creator as an admin member and updates their point_balances with the household_id.';

COMMENT ON FUNCTION public.handle_household_join() IS
'Automatically updates the joining user''s point_balances with the household_id when they join a household.';