/**
 * Seed Test Users for E2E Testing
 *
 * This script creates test users in Supabase for E2E testing.
 * Run with: npx ts-node scripts/seed-test-users.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable
 */

import { createClient } from '@supabase/supabase-js';

const TEST_USERS = [
  {
    email: 'parent@test.com',
    password: 'Test1234!',
    displayName: 'Test Parent',
    role: 'parent',
  },
  {
    email: 'child@test.com',
    password: 'Test1234!',
    displayName: 'Test Child',
    role: 'child',
  },
  {
    email: 'partner@test.com',
    password: 'Test1234!',
    displayName: 'Test Partner',
    role: 'partner',
  },
  {
    email: 'solo@test.com',
    password: 'Test1234!',
    displayName: 'Test Solo',
    role: 'solo',
  },
];

async function seedTestUsers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing required environment variables:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'missing');
    console.error('- SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'set' : 'missing');
    console.error('\nPlease set SUPABASE_SERVICE_ROLE_KEY in your environment.');
    console.error('You can find it in Supabase Dashboard > Settings > API > service_role key');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('Seeding test users...\n');

  for (const user of TEST_USERS) {
    try {
      // Check if user already exists
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        console.error(`Error listing users: ${listError.message}`);
        continue;
      }

      const existing = existingUsers.users.find(u => u.email === user.email);

      if (existing) {
        console.log(`User ${user.email} already exists (id: ${existing.id})`);

        // Update profile display name
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ display_name: user.displayName })
          .eq('id', existing.id);

        if (updateError) {
          console.error(`  Failed to update profile: ${updateError.message}`);
        } else {
          console.log(`  Profile updated: ${user.displayName}`);
        }
        continue;
      }

      // Create user
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          display_name: user.displayName,
        },
      });

      if (error) {
        console.error(`Failed to create ${user.email}: ${error.message}`);
        continue;
      }

      console.log(`Created user: ${user.email} (id: ${data.user.id})`);

      // Wait for profile trigger to create profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify profile was created
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error(`  Profile creation failed: ${profileError.message}`);
      } else {
        console.log(`  Profile created: ${profile.display_name}`);
      }

    } catch (err) {
      console.error(`Error processing ${user.email}:`, err);
    }
  }

  console.log('\nTest users seeded successfully!');
  console.log('\nYou can now use these credentials for E2E testing:');
  TEST_USERS.forEach(user => {
    console.log(`  ${user.role}: ${user.email} / ${user.password}`);
  });
}

seedTestUsers().catch(console.error);