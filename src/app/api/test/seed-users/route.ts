/**
 * API Endpoint for Seeding Test Users
 *
 * This endpoint creates test users for E2E testing.
 * Only available in development/test environments.
 *
 * POST /api/test/seed-users
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

export async function POST(request: Request) {
  // Only allow in development/test environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is not available in production' },
      { status: 403 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        error: 'Missing required environment variables',
        details: 'SUPABASE_SERVICE_ROLE_KEY must be set'
      },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const results: Array<{
    email: string;
    status: 'created' | 'exists' | 'error';
    userId?: string;
    error?: string;
  }> = [];

  for (const user of TEST_USERS) {
    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existing = existingUsers.users.find(u => u.email === user.email);

      if (existing) {
        // Update profile display name
        await supabase
          .from('profiles')
          .update({ display_name: user.displayName })
          .eq('id', existing.id);

        results.push({
          email: user.email,
          status: 'exists',
          userId: existing.id,
        });
        continue;
      }

      // Create user
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          display_name: user.displayName,
        },
      });

      if (error) {
        results.push({
          email: user.email,
          status: 'error',
          error: error.message,
        });
        continue;
      }

      results.push({
        email: user.email,
        status: 'created',
        userId: data.user.id,
      });

    } catch (err) {
      results.push({
        email: user.email,
        status: 'error',
        error: String(err),
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Test users processed',
    users: results,
    credentials: TEST_USERS.map(u => ({
      role: u.role,
      email: u.email,
      password: u.password,
    })),
  });
}

export async function GET() {
  // Return test user credentials (for E2E tests to discover)
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is not available in production' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    testUsers: TEST_USERS.map(u => ({
      role: u.role,
      email: u.email,
      password: u.password,
      displayName: u.displayName,
    })),
  });
}