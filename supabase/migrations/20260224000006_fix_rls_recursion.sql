-- Fix infinite recursion in RLS policies
-- The problem: household_members policies query household_members, causing infinite recursion

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view members of their household" ON public.household_members;
DROP POLICY IF EXISTS "Users can insert themselves into household_members" ON public.household_members;
DROP POLICY IF EXISTS "Admins can update household_members" ON public.household_members;
DROP POLICY IF EXISTS "Admins can delete household_members" ON public.household_members;

-- Create a security definer function to check household membership
CREATE OR REPLACE FUNCTION public.is_household_member(household_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = household_uuid
    AND user_id = auth.uid()
  );
END;
$$;

-- Create a function to check if user is admin of a household
CREATE OR REPLACE FUNCTION public.is_household_admin(household_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = household_uuid
    AND user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Create a function to check if a user is in the same household as another user
CREATE OR REPLACE FUNCTION public.is_same_household_member(target_user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.household_members hm1
    WHERE hm1.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.household_members hm2
      WHERE hm2.household_id = hm1.household_id
      AND hm2.user_id = target_user_uuid
    )
  );
END;
$$;

-- Now recreate the policies using the security definer functions

-- Policy for viewing household members
CREATE POLICY "Users can view members of their household"
  ON public.household_members FOR SELECT
  USING (public.is_household_member(household_id));

-- Policy for inserting (joining a household)
CREATE POLICY "Users can insert themselves into household_members"
  ON public.household_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for updating (admin only)
CREATE POLICY "Admins can update household_members"
  ON public.household_members FOR UPDATE
  USING (public.is_household_admin(household_id));

-- Policy for deleting (admin or self)
CREATE POLICY "Users can leave or admins can remove members"
  ON public.household_members FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.is_household_admin(household_id)
  );

-- Also fix the profiles RLS policy that was causing issues
DROP POLICY IF EXISTS "Users can view own and household members' profiles" ON public.profiles;

CREATE POLICY "Users can view own and household members' profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_same_household_member(id)
  );

-- Fix households policies
DROP POLICY IF EXISTS "Users can view their household" ON public.households;
DROP POLICY IF EXISTS "Admins can update households" ON public.households;
DROP POLICY IF EXISTS "Admins can delete households" ON public.households;

CREATE POLICY "Users can view their household"
  ON public.households FOR SELECT
  USING (public.is_household_member(id));

CREATE POLICY "Admins can update households"
  ON public.households FOR UPDATE
  USING (public.is_household_admin(id));

CREATE POLICY "Admins can delete households"
  ON public.households FOR DELETE
  USING (public.is_household_admin(id));

-- Fix invite_codes policies
DROP POLICY IF EXISTS "Users can view invite codes for their household" ON public.invite_codes;
DROP POLICY IF EXISTS "Admins can create invite codes" ON public.invite_codes;
DROP POLICY IF EXISTS "Admins can delete invite codes" ON public.invite_codes;

CREATE POLICY "Users can view invite codes for their household"
  ON public.invite_codes FOR SELECT
  USING (public.is_household_member(household_id));

CREATE POLICY "Admins can create invite codes"
  ON public.invite_codes FOR INSERT
  WITH CHECK (public.is_household_admin(household_id));

CREATE POLICY "Admins can delete invite codes"
  ON public.invite_codes FOR DELETE
  USING (public.is_household_admin(household_id));

-- Fix chores policies
DROP POLICY IF EXISTS "Users can view chores in their household" ON public.chores;
DROP POLICY IF EXISTS "Users can create chores in their household" ON public.chores;
DROP POLICY IF EXISTS "Users can update chores in their household" ON public.chores;
DROP POLICY IF EXISTS "Users can delete chores in their household" ON public.chores;

CREATE POLICY "Users can view chores in their household"
  ON public.chores FOR SELECT
  USING (public.is_household_member(household_id));

CREATE POLICY "Users can create chores in their household"
  ON public.chores FOR INSERT
  WITH CHECK (public.is_household_member(household_id));

CREATE POLICY "Users can update chores in their household"
  ON public.chores FOR UPDATE
  USING (public.is_household_member(household_id));

CREATE POLICY "Users can delete chores in their household"
  ON public.chores FOR DELETE
  USING (public.is_household_member(household_id));

-- Fix recurring_chores policies
DROP POLICY IF EXISTS "Users can view recurring chores in their household" ON public.recurring_chores;
DROP POLICY IF EXISTS "Users can create recurring chores in their household" ON public.recurring_chores;
DROP POLICY IF EXISTS "Users can update recurring chores in their household" ON public.recurring_chores;
DROP POLICY IF EXISTS "Users can delete recurring chores in their household" ON public.recurring_chores;

CREATE POLICY "Users can view recurring chores in their household"
  ON public.recurring_chores FOR SELECT
  USING (public.is_household_member(household_id));

CREATE POLICY "Users can create recurring chores in their household"
  ON public.recurring_chores FOR INSERT
  WITH CHECK (public.is_household_member(household_id));

CREATE POLICY "Users can update recurring chores in their household"
  ON public.recurring_chores FOR UPDATE
  USING (public.is_household_member(household_id));

CREATE POLICY "Users can delete recurring chores in their household"
  ON public.recurring_chores FOR DELETE
  USING (public.is_household_member(household_id));