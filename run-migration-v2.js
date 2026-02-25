#!/usr/bin/env node
/**
 * PROJ-8: Database Triggers Migration
 * Try multiple connection modes
 */

const { Pool } = require('pg');

const PASSWORD = 'Wertzug1234.';
const PROJECT_REF = 'uyfogthmpmenivnyiioe';

// Different connection strings to try
const connectionStrings = [
  // Transaction pooler (port 6543)
  `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@aws-1-eu-west-1.pooler.supabase.com:6543/postgres`,
  // Session pooler (port 5432)
  `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`,
  // Direct connection (requires IPv4)
  `postgresql://postgres:${PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
];

async function testConnections() {
  console.log('🔍 Testing connection strings...\n');

  for (const connStr of connectionStrings) {
    const pool = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });

    try {
      const result = await pool.query('SELECT NOW()');
      console.log(`✅ SUCCESS: ${connStr.replace(PASSWORD, '****')}`);
      await pool.end();
      return connStr;
    } catch (error) {
      console.log(`❌ ${error.message.substring(0, 50)}...`);
    }
    await pool.end();
  }

  return null;
}

async function main() {
  const workingConnStr = await testConnections();

  if (!workingConnStr) {
    console.log('\n❌ No working connection found.');
    console.log('\nPlease check:');
    console.log('1. Database password in Supabase Dashboard > Settings > Database');
    console.log('2. Connection pooling settings');
    return;
  }

  console.log(`\n✅ Using: ${workingConnStr.replace(PASSWORD, '****')}\n`);

  // Now run the migration
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: workingConnStr,
    ssl: { rejectUnauthorized: false }
  });

  const migrationSQL = `
-- PROJ-8: Database Triggers for User Onboarding
ALTER TABLE public.point_balances ALTER COLUMN household_id DROP NOT NULL;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name',
    CASE WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1) ELSE 'User' END), NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.point_balances (user_id, household_id, current_balance, total_earned, total_spent, updated_at)
  VALUES (NEW.id, NULL, 0, 0, 0, NOW()) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_levels (user_id, current_level, total_points, updated_at)
  VALUES (NEW.id, 1, 0, NOW()) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_completion_date, updated_at)
  VALUES (NEW.id, 0, 0, NULL, NOW()) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_household_creation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.household_members (household_id, user_id, role, joined_at)
  VALUES (NEW.id, NEW.created_by, 'admin', NOW()) ON CONFLICT DO NOTHING;
  UPDATE public.point_balances SET household_id = NEW.id, updated_at = NOW()
  WHERE user_id = NEW.created_by AND household_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_household_created ON public.households;
CREATE TRIGGER on_household_created AFTER INSERT ON public.households FOR EACH ROW EXECUTE FUNCTION public.handle_household_creation();

CREATE OR REPLACE FUNCTION public.handle_household_join()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.point_balances SET household_id = NEW.household_id, updated_at = NOW()
  WHERE user_id = NEW.user_id AND household_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_household_member_added ON public.household_members;
CREATE TRIGGER on_household_member_added AFTER INSERT ON public.household_members FOR EACH ROW EXECUTE FUNCTION public.handle_household_join();

-- Backfill
INSERT INTO public.point_balances (user_id, household_id, current_balance, total_earned, total_spent, updated_at)
SELECT u.id, hm.household_id, 0, 0, 0, NOW() FROM auth.users u
LEFT JOIN public.point_balances pb ON pb.user_id = u.id
LEFT JOIN public.household_members hm ON hm.user_id = u.id WHERE pb.id IS NULL;

INSERT INTO public.user_levels (user_id, current_level, total_points, updated_at)
SELECT u.id, 1, 0, NOW() FROM auth.users u
LEFT JOIN public.user_levels ul ON ul.user_id = u.id WHERE ul.id IS NULL;

INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_completion_date, updated_at)
SELECT u.id, 0, 0, NULL, NOW() FROM auth.users u
LEFT JOIN public.user_streaks us ON us.user_id = u.id WHERE us.id IS NULL;
`;

  try {
    console.log('📝 Executing migration...\n');
    await pool.query(migrationSQL);
    console.log('✅ Migration executed!\n');

    const pb = await pool.query('SELECT COUNT(*) FROM public.point_balances');
    const ul = await pool.query('SELECT COUNT(*) FROM public.user_levels');
    const us = await pool.query('SELECT COUNT(*) FROM public.user_streaks');
    const users = await pool.query('SELECT COUNT(*) FROM auth.users');

    console.log(`📊 Results:`);
    console.log(`   Users: ${users.rows[0].count}`);
    console.log(`   point_balances: ${pb.rows[0].count}`);
    console.log(`   user_levels: ${ul.rows[0].count}`);
    console.log(`   user_streaks: ${us.rows[0].count}`);

    await pool.end();
    console.log('\n🎉 Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

main();