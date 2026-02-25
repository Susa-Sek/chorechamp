#!/usr/bin/env node
/**
 * PROJ-8: Database Triggers Migration
 * Direct PostgreSQL connection
 */

const { Pool } = require('pg');

const PASSWORD = 'Wertzug1234.';
const PROJECT_REF = 'uyfogthmpmenivnyiioe';

// Use transaction mode pooler for DDL operations
const pool = new Pool({
  connectionString: `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
  ssl: { rejectUnauthorized: false }
});

const migrationSQL = `
-- ============================================================================
-- PROJ-8: Database Triggers for User Onboarding
-- ============================================================================

-- Step 1: Allow NULL household_id for new users
ALTER TABLE public.point_balances ALTER COLUMN household_id DROP NOT NULL;

-- Step 2: Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 3: Enhanced user creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      CASE WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1) ELSE 'User' END
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.point_balances (user_id, household_id, current_balance, total_earned, total_spent, updated_at)
  VALUES (NEW.id, NULL, 0, 0, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_levels (user_id, current_level, total_points, updated_at)
  VALUES (NEW.id, 1, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_completion_date, updated_at)
  VALUES (NEW.id, 0, 0, NULL, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Step 4: Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Household creation handler
CREATE OR REPLACE FUNCTION public.handle_household_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.household_members (household_id, user_id, role, joined_at)
  VALUES (NEW.id, NEW.created_by, 'admin', NOW())
  ON CONFLICT (household_id, user_id) DO NOTHING;

  UPDATE public.point_balances
  SET household_id = NEW.id, updated_at = NOW()
  WHERE user_id = NEW.created_by AND household_id IS NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_household_created ON public.households;
CREATE TRIGGER on_household_created
  AFTER INSERT ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_household_creation();

-- Step 6: Household join handler
CREATE OR REPLACE FUNCTION public.handle_household_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.point_balances
  SET household_id = NEW.household_id, updated_at = NOW()
  WHERE user_id = NEW.user_id AND household_id IS NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_household_member_added ON public.household_members;
CREATE TRIGGER on_household_member_added
  AFTER INSERT ON public.household_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_household_join();

-- Step 7: Backfill existing users
INSERT INTO public.point_balances (user_id, household_id, current_balance, total_earned, total_spent, updated_at)
SELECT u.id, hm.household_id, 0, 0, 0, NOW()
FROM auth.users u
LEFT JOIN public.point_balances pb ON pb.user_id = u.id
LEFT JOIN public.household_members hm ON hm.user_id = u.id
WHERE pb.id IS NULL;

INSERT INTO public.user_levels (user_id, current_level, total_points, updated_at)
SELECT u.id, 1, 0, NOW()
FROM auth.users u
LEFT JOIN public.user_levels ul ON ul.user_id = u.id
WHERE ul.id IS NULL;

INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_completion_date, updated_at)
SELECT u.id, 0, 0, NULL, NOW()
FROM auth.users u
LEFT JOIN public.user_streaks us ON us.user_id = u.id
WHERE us.id IS NULL;
`;

async function runMigration() {
  console.log('🚀 Starting PROJ-8 Migration...\n');
  console.log('📡 Connecting to Supabase...\n');

  try {
    // Test connection first
    const testResult = await pool.query('SELECT NOW() as now');
    console.log(`✅ Connected! Server time: ${testResult.rows[0].now}\n`);

    // Execute migration
    console.log('📝 Executing migration...\n');
    await pool.query(migrationSQL);
    console.log('✅ Migration executed successfully!\n');

    // Verify results
    console.log('🔍 Verifying results...\n');

    const pbCount = await pool.query('SELECT COUNT(*) FROM public.point_balances');
    console.log(`📊 point_balances: ${pbCount.rows[0].count} records`);

    const ulCount = await pool.query('SELECT COUNT(*) FROM public.user_levels');
    console.log(`📊 user_levels: ${ulCount.rows[0].count} records`);

    const usCount = await pool.query('SELECT COUNT(*) FROM public.user_streaks');
    console.log(`📊 user_streaks: ${usCount.rows[0].count} records`);

    const usersCount = await pool.query('SELECT COUNT(*) FROM auth.users');
    console.log(`📊 auth.users: ${usersCount.rows[0].count} users`);

    const nullHh = await pool.query('SELECT COUNT(*) FROM public.point_balances WHERE household_id IS NULL');
    console.log(`📊 point_balances with NULL household_id: ${nullHh.rows[0].count} records`);

    // Check trigger exists
    const triggerCheck = await pool.query(`
      SELECT trigger_name FROM information_schema.triggers
      WHERE event_object_table = 'users' AND trigger_name = 'on_auth_user_created'
    `);
    console.log(`✅ Trigger on_auth_user_created: ${triggerCheck.rows.length > 0 ? 'EXISTS' : 'NOT FOUND'}`);

    await pool.end();

    console.log('\n🎉 Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Test user registration - new users should get all records automatically');
    console.log('2. Test household creation - user should become admin member');
    console.log('3. Verify no 406 errors on dashboard');

    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    await pool.end();
    return false;
  }
}

runMigration();