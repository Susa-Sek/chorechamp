#!/usr/bin/env node
/**
 * PROJ-8: Database Triggers Migration
 * Applies user onboarding triggers to Supabase
 */

const SUPABASE_URL = 'https://uyfogthmpmenivnyiioe.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Zm9ndGhtcG1lbml2bnlpaW9lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM3MTY4NSwiZXhwIjoyMDg1OTQ3Njg1fQ.HZr7uEnQbsriEv2N0PrUVtIH-PRef915C3dVRvy1wyc';

const fs = require('fs');
const path = require('path');

// Migration SQL
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

  // Split into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip empty or comment-only statements
    if (statement.trim() === ';' || statement.trim().startsWith('--')) {
      continue;
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql: statement })
      });

      if (!response.ok) {
        const error = await response.text();
        // Try alternative approach using direct query
        console.log(`⚠️ Statement ${i + 1} needs alternative execution...`);

        // For DDL statements, we need to use a different approach
        // Let's try using the query endpoint
        const queryResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            query: statement
          })
        });

        if (!queryResponse.ok) {
          console.error(`❌ Statement ${i + 1} failed: ${error}`);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed (alt)`);
          successCount++;
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Statement ${i + 1} error:`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);

  return errorCount === 0;
}

// Alternative: Use direct PostgreSQL connection via Supabase pooler
async function runMigrationDirect() {
  console.log('🔗 Attempting direct database connection...\n');

  const { Client } = require('pg');

  // Supabase pooler connection (transaction mode)
  const client = new Client({
    connectionString: 'postgresql://postgres.uyfogthmpmenivnyiioe:Housholdapp!25@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Execute migration
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully!\n');

    // Verify
    const result = await client.query('SELECT COUNT(*) FROM public.point_balances');
    console.log(`📊 Total point_balances records: ${result.rows[0].count}`);

    await client.end();
    return true;
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    try { await client.end(); } catch {}
    return false;
  }
}

// Main execution
console.log('='.repeat(60));
console.log('PROJ-8: Database Triggers Migration');
console.log('='.repeat(60) + '\n');

runMigrationDirect().then(success => {
  if (success) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test user registration');
    console.log('2. Verify point_balances, user_levels, user_streaks created');
    console.log('3. Test household creation');
  } else {
    console.log('\n❌ Migration failed. Check errors above.');
    console.log('\nAlternative: Run the SQL manually in Supabase Dashboard > SQL Editor');
  }
});