const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uyfogthmpmenivnyiioe.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Zm9ndGhtcG1lbml2bnlpaW9lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM3MTY4NSwiZXhwIjoyMDg1OTQ3Njg1fQ.HZr7uEnQbsriEv2N0PrUVtIH-PRef915C3dVRvy1wyc';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL statements to create ChoreChamp tables
const migrations = [
  {
    name: 'profiles table',
    sql: `
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(display_name) >= 2 AND char_length(display_name) <= 50),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
    `
  },
  {
    name: 'handle_new_user function',
    sql: `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
    `
  },
  {
    name: 'households table',
    sql: `
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 50),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL CHECK (char_length(code) = 6),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_household_members_user ON public.household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household ON public.household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON public.invite_codes(code);

GRANT ALL ON public.households TO authenticated;
GRANT ALL ON public.household_members TO authenticated;
GRANT ALL ON public.invite_codes TO authenticated;
    `
  },
  {
    name: 'chores table',
    sql: `
CREATE TABLE IF NOT EXISTS public.chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.chore_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chore_id UUID REFERENCES public.chores(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  points_awarded INTEGER NOT NULL,
  undone_at TIMESTAMPTZ,
  undone_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chore_completions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_chores_household ON public.chores(household_id);
CREATE INDEX IF NOT EXISTS idx_chores_assignee ON public.chores(assignee_id);
CREATE INDEX IF NOT EXISTS idx_chores_due_date ON public.chores(due_date);
CREATE INDEX IF NOT EXISTS idx_chores_status ON public.chores(status);

GRANT ALL ON public.chores TO authenticated;
GRANT ALL ON public.chore_completions TO authenticated;
    `
  },
  {
    name: 'recurring_chores table',
    sql: `
CREATE TABLE IF NOT EXISTS public.recurring_chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  chore_id UUID REFERENCES public.chores(id) ON DELETE CASCADE NOT NULL,
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'custom')),
  recurrence_pattern JSONB NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  next_due_date TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reminder_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT 'day_before' CHECK (reminder_type IN ('day_before', 'morning_of', 'custom_hours_before')),
  custom_hours INTEGER CHECK (custom_hours > 0),
  push_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  UNIQUE(user_id)
);

ALTER TABLE public.recurring_chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_preferences ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_recurring_chores_next_due ON public.recurring_chores(next_due_date);
CREATE INDEX IF NOT EXISTS idx_recurring_chores_household ON public.recurring_chores(household_id);

GRANT ALL ON public.recurring_chores TO authenticated;
GRANT ALL ON public.reminder_preferences TO authenticated;
    `
  },
  {
    name: 'RLS policies for household members viewing profiles',
    sql: `
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own and household members' profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM public.household_members hm1
      JOIN public.household_members hm2 ON hm1.household_id = hm2.household_id
      WHERE hm1.user_id = auth.uid()
      AND hm2.user_id = public.profiles.id
    )
  );
    `
  },
  {
    name: 'RLS policies for households',
    sql: `
CREATE POLICY IF NOT EXISTS "Users can view their household"
  ON public.households FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = public.households.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can create households"
  ON public.households FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY IF NOT EXISTS "Admins can update households"
  ON public.households FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = public.households.id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can delete households"
  ON public.households FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = public.households.id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );
    `
  },
  {
    name: 'RLS policies for household_members',
    sql: `
CREATE POLICY IF NOT EXISTS "Users can view members of their household"
  ON public.household_members FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can insert themselves into household_members"
  ON public.household_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins can update household_members"
  ON public.household_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      JOIN public.household_members admin ON hm.household_id = admin.household_id
      WHERE hm.id = public.household_members.id
      AND admin.user_id = auth.uid()
      AND admin.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can delete household_members"
  ON public.household_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      JOIN public.household_members admin ON hm.household_id = admin.household_id
      WHERE hm.id = public.household_members.id
      AND admin.user_id = auth.uid()
      AND admin.role = 'admin'
    )
  ) OR user_id = auth.uid();
    `
  },
  {
    name: 'RLS policies for invite_codes',
    sql: `
CREATE POLICY IF NOT EXISTS "Users can view invite codes for their household"
  ON public.invite_codes FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can create invite codes"
  ON public.invite_codes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = public.invite_codes.household_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "System can update invite codes"
  ON public.invite_codes FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Admins can delete invite codes"
  ON public.invite_codes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = public.invite_codes.household_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );
    `
  },
  {
    name: 'RLS policies for chores',
    sql: `
CREATE POLICY IF NOT EXISTS "Users can view chores in their household"
  ON public.chores FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can create chores in their household"
  ON public.chores FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can update chores in their household"
  ON public.chores FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can delete chores in their household"
  ON public.chores FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );
    `
  },
  {
    name: 'RLS policies for recurring_chores',
    sql: `
CREATE POLICY IF NOT EXISTS "Users can view recurring chores in their household"
  ON public.recurring_chores FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can create recurring chores in their household"
  ON public.recurring_chores FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can update recurring chores in their household"
  ON public.recurring_chores FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can delete recurring chores in their household"
  ON public.recurring_chores FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can manage their own reminder preferences"
  ON public.reminder_preferences FOR ALL
  USING (auth.uid() = user_id);
    `
  }
];

async function applyMigrations() {
  console.log('🚀 Creating ChoreChamp database tables...\n');

  for (const migration of migrations) {
    console.log(`📄 Applying: ${migration.name}`);

    try {
      // Use the SQL execution endpoint
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: migration.sql })
      });

      const result = await response.text();

      if (response.ok) {
        console.log(`✅ Success: ${migration.name}\n`);
      } else if (result.includes('already exists') || result.includes('duplicate')) {
        console.log(`⚠️  Already exists: ${migration.name}\n`);
      } else {
        console.log(`⚠️  Response: ${result.substring(0, 100)}...\n`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }

  // Verify tables were created
  console.log('\n📋 Verifying tables...\n');

  const tables = ['profiles', 'households', 'household_members', 'invite_codes', 'chores', 'chore_completions', 'recurring_chores', 'reminder_preferences'];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        console.log(`❌ ${table} - NOT CREATED`);
      } else {
        console.log(`⚠️  ${table} - ${error.message}`);
      }
    } else {
      console.log(`✅ ${table} - EXISTS`);
    }
  }

  console.log('\n✨ Done!');
}

applyMigrations().catch(console.error);