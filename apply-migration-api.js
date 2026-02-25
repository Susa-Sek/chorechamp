#!/usr/bin/env node
/**
 * PROJ-8: Database Triggers Migration via REST API
 * Uses Supabase service role key to execute SQL
 */

const SUPABASE_URL = 'https://uyfogthmpmenivnyiioe.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Zm9ndGhtcG1lbml2bnlpaW9lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM3MTY4NSwiZXhwIjoyMDg1OTQ3Njg1fQ.HZr7uEnQbsriEv2N0PrUVtIH-PRef915C3dVRvy1wyc';

// Individual SQL statements to execute
const statements = [
  // Step 1: Allow NULL household_id
  `ALTER TABLE public.point_balances ALTER COLUMN household_id DROP NOT NULL;`,

  // Step 2: Drop existing trigger
  `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`,

  // Step 3: Create enhanced function
  `CREATE OR REPLACE FUNCTION public.handle_new_user()
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
$$;`,

  // Step 4: Create trigger
  `CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();`,

  // Step 5: Household creation handler
  `CREATE OR REPLACE FUNCTION public.handle_household_creation()
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
$$;`,

  // Step 6: Create household trigger
  `DROP TRIGGER IF EXISTS on_household_created ON public.households;
CREATE TRIGGER on_household_created
  AFTER INSERT ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_household_creation();`,

  // Step 7: Household join handler
  `CREATE OR REPLACE FUNCTION public.handle_household_join()
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
$$;`,

  // Step 8: Create household member trigger
  `DROP TRIGGER IF EXISTS on_household_member_added ON public.household_members;
CREATE TRIGGER on_household_member_added
  AFTER INSERT ON public.household_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_household_join();`,

  // Step 9: Backfill point_balances
  `INSERT INTO public.point_balances (user_id, household_id, current_balance, total_earned, total_spent, updated_at)
SELECT u.id, hm.household_id, 0, 0, 0, NOW()
FROM auth.users u
LEFT JOIN public.point_balances pb ON pb.user_id = u.id
LEFT JOIN public.household_members hm ON hm.user_id = u.id
WHERE pb.id IS NULL;`,

  // Step 10: Backfill user_levels
  `INSERT INTO public.user_levels (user_id, current_level, total_points, updated_at)
SELECT u.id, 1, 0, NOW()
FROM auth.users u
LEFT JOIN public.user_levels ul ON ul.user_id = u.id
WHERE ul.id IS NULL;`,

  // Step 11: Backfill user_streaks
  `INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_completion_date, updated_at)
SELECT u.id, 0, 0, NULL, NOW()
FROM auth.users u
LEFT JOIN public.user_streaks us ON us.user_id = u.id
WHERE us.id IS NULL;`
];

async function executeSQL(sql, description) {
  try {
    // Use the Supabase SQL endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        sql: sql
      })
    });

    if (response.ok) {
      console.log(`✅ ${description}`);
      return { success: true };
    } else {
      const error = await response.text();
      console.log(`⚠️ ${description} - trying alternative method...`);

      // Try using the query parameter approach
      const altResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ query: sql })
      });

      if (altResponse.ok) {
        console.log(`✅ ${description} (alt)`);
        return { success: true };
      } else {
        console.error(`❌ ${description}: ${error}`);
        return { success: false, error };
      }
    }
  } catch (err) {
    console.error(`❌ ${description}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('PROJ-8: Database Triggers Migration');
  console.log('='.repeat(60) + '\n');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const result = await executeSQL(statements[i], `Statement ${i + 1}/${statements.length}`);
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay between statements
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Summary: ${successCount} succeeded, ${failCount} failed`);
  console.log('='.repeat(60));

  // Verify
  console.log('\n🔍 Verifying migration...\n');

  try {
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/point_balances?select=count`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'count=exact'
      }
    });

    if (verifyResponse.ok) {
      const count = verifyResponse.headers.get('content-range');
      console.log(`📊 point_balances count: ${count}`);
    }
  } catch (err) {
    console.log('Could not verify');
  }
}

main();