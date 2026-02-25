-- Recurring Tasks Tables and RLS Policies
-- Run this migration in Supabase SQL Editor
-- Depends on: profiles, households, household_members, chores tables

-- ============================================================================
-- TABLES
-- ============================================================================

-- Recurring chore templates
CREATE TABLE IF NOT EXISTS recurring_chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  chore_id UUID REFERENCES chores(id) ON DELETE CASCADE NOT NULL,
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'custom')),
  recurrence_pattern JSONB NOT NULL, -- {"days": [1,3,5]} or {"dayOfMonth": 15} or {"intervalDays": 3}
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  next_due_date TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminder preferences (one row per user)
CREATE TABLE IF NOT EXISTS reminder_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT 'day_before' CHECK (reminder_type IN ('day_before', 'morning_of', 'custom_hours_before')),
  custom_hours INTEGER CHECK (custom_hours > 0),
  push_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for finding due recurring chores (for scheduled jobs)
CREATE INDEX IF NOT EXISTS idx_recurring_chores_next_due ON recurring_chores(next_due_date);

-- Index for household filtering
CREATE INDEX IF NOT EXISTS idx_recurring_chores_household ON recurring_chores(household_id);

-- Index for finding active recurring chores
CREATE INDEX IF NOT EXISTS idx_recurring_chores_active ON recurring_chores(active) WHERE active = true;

-- Index for chore lookups
CREATE INDEX IF NOT EXISTS idx_recurring_chores_chore_id ON recurring_chores(chore_id);

-- Index for finding recurring chores by creator
CREATE INDEX IF NOT EXISTS idx_recurring_chores_created_by ON recurring_chores(created_by);

-- Index for reminder preferences user lookup
CREATE INDEX IF NOT EXISTS idx_reminder_preferences_user_id ON reminder_preferences(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE recurring_chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: recurring_chores
-- ============================================================================

-- SELECT: Users can only see recurring chores in households they are members of
CREATE POLICY "Users can view recurring chores in their household"
  ON recurring_chores FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Household members can create recurring chores
CREATE POLICY "Household members can create recurring chores"
  ON recurring_chores FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- UPDATE: Household members can update recurring chores in their household
CREATE POLICY "Household members can update recurring chores"
  ON recurring_chores FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- DELETE: Household members can delete recurring chores in their household
CREATE POLICY "Household members can delete recurring chores"
  ON recurring_chores FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: reminder_preferences
-- ============================================================================

-- SELECT: Users can only see their own reminder preferences
CREATE POLICY "Users can view their own reminder preferences"
  ON reminder_preferences FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can create their own reminder preferences
CREATE POLICY "Users can create their own reminder preferences"
  ON reminder_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own reminder preferences
CREATE POLICY "Users can update their own reminder preferences"
  ON reminder_preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own reminder preferences
CREATE POLICY "Users can delete their own reminder preferences"
  ON reminder_preferences FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update recurring_chores.updated_at timestamp
DROP TRIGGER IF EXISTS update_recurring_chores_updated_at ON recurring_chores;
CREATE TRIGGER update_recurring_chores_updated_at
  BEFORE UPDATE ON recurring_chores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update reminder_preferences.updated_at timestamp
DROP TRIGGER IF EXISTS update_reminder_preferences_updated_at ON reminder_preferences;
CREATE TRIGGER update_reminder_preferences_updated_at
  BEFORE UPDATE ON reminder_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANTS (for service role if needed)
-- ============================================================================

GRANT ALL ON recurring_chores TO service_role;
GRANT ALL ON reminder_preferences TO service_role;

-- Grant permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON recurring_chores TO authenticated;
GRANT ALL ON reminder_preferences TO authenticated;