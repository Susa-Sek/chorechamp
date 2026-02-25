-- Fix: Allow household members to view each other's profiles
-- This is required for the household member list to display names and avatars

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a new policy that allows viewing own profile OR profiles of household members
CREATE POLICY "Users can view own and household members' profiles"
  ON public.profiles
  FOR SELECT
  USING (
    -- User can view their own profile
    auth.uid() = id
    OR
    -- User can view profiles of household members
    EXISTS (
      SELECT 1 FROM household_members hm1
      JOIN household_members hm2 ON hm1.household_id = hm2.household_id
      WHERE hm1.user_id = auth.uid()
      AND hm2.user_id = profiles.id
    )
  );
