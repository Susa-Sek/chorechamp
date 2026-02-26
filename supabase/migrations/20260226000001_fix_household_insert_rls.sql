-- Fix missing INSERT policy for households table
-- This was accidentally removed during RLS recursion fix

-- Drop any existing INSERT policy (just in case)
DROP POLICY IF EXISTS "Authenticated users can create households" ON public.households;

-- Create the INSERT policy for households
CREATE POLICY "Authenticated users can create households"
  ON public.households FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Also ensure the household_members INSERT policy allows initial join
-- When creating a household, the user needs to be added as admin
DROP POLICY IF EXISTS "Users can insert themselves into household_members" ON public.household_members;

CREATE POLICY "Users can insert themselves into household_members"
  ON public.household_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
