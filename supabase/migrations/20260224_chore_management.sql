-- Chore Management Tables and RLS Policies
-- Run this migration in Supabase SQL Editor
-- Depends on: profiles, households, household_members tables

-- ============================================================================
-- TABLES
-- ============================================================================

-- Chores table
CREATE TABLE IF NOT EXISTS chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  points INTEGER NOT NULL DEFAULT 10 CHECK (points >= 1 AND points <= 100),
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'archived')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chore completion history (for undo and statistics)
CREATE TABLE IF NOT EXISTS chore_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chore_id UUID REFERENCES chores(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  points_awarded INTEGER NOT NULL,
  undone_at TIMESTAMPTZ,
  undone_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for household filtering (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_chores_household_id ON chores(household_id);

-- Index for assignee lookups
CREATE INDEX IF NOT EXISTS idx_chores_assignee_id ON chores(assignee_id);

-- Index for due date sorting/filtering
CREATE INDEX IF NOT EXISTS idx_chores_due_date ON chores(due_date);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_chores_status ON chores(status);

-- Index for combined household + status queries
CREATE INDEX IF NOT EXISTS idx_chores_household_status ON chores(household_id, status);

-- Index for finding chores by creator
CREATE INDEX IF NOT EXISTS idx_chores_created_by ON chores(created_by);

-- Index for chore_completions lookups
CREATE INDEX IF NOT EXISTS idx_chore_completions_chore_id ON chore_completions(chore_id);
CREATE INDEX IF NOT EXISTS idx_chore_completions_user_id ON chore_completions(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: chores
-- ============================================================================

-- SELECT: Users can only see chores in households they are members of
CREATE POLICY "Users can view chores in their household"
  ON chores FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Household members can create chores
CREATE POLICY "Household members can create chores"
  ON chores FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- UPDATE: Household members can update chores in their household
CREATE POLICY "Household members can update chores"
  ON chores FOR UPDATE
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

-- DELETE: Household members can delete chores in their household
CREATE POLICY "Household members can delete chores"
  ON chores FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: chore_completions
-- ============================================================================

-- SELECT: Users can view completions for chores in their household
CREATE POLICY "Users can view completions in their household"
  ON chore_completions FOR SELECT
  USING (
    chore_id IN (
      SELECT id FROM chores
      WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

-- INSERT: Users can record completions for chores in their household
CREATE POLICY "Users can record completions"
  ON chore_completions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND chore_id IN (
      SELECT id FROM chores
      WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

-- UPDATE: Users can update completions (for undo functionality)
CREATE POLICY "Users can update completions"
  ON chore_completions FOR UPDATE
  USING (
    chore_id IN (
      SELECT id FROM chores
      WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update chores.updated_at timestamp
DROP TRIGGER IF EXISTS update_chores_updated_at ON chores;
CREATE TRIGGER update_chores_updated_at
  BEFORE UPDATE ON chores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANTS (for service role if needed)
-- ============================================================================

GRANT ALL ON chores TO service_role;
GRANT ALL ON chore_completions TO service_role;

-- Grant permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON chores TO authenticated;
GRANT ALL ON chore_completions TO authenticated;