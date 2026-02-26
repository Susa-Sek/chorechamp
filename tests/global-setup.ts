/**
 * Playwright Global Setup
 *
 * This runs before all tests to:
 * 1. Seed test users in Supabase
 * 2. Ensure the dev server is running
 */

import { FullConfig, request } from '@playwright/test';

const TEST_USERS = [
  { email: 'parent@test.com', password: 'Test1234!', displayName: 'Test Parent' },
  { email: 'child@test.com', password: 'Test1234!', displayName: 'Test Child' },
  { email: 'partner@test.com', password: 'Test1234!', displayName: 'Test Partner' },
  { email: 'solo@test.com', password: 'Test1234!', displayName: 'Test Solo' },
];

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';

  console.log('Setting up test environment...');
  console.log(`Base URL: ${baseURL}`);

  // Create API request context
  const context = await request.newContext({
    baseURL,
  });

  try {
    // Try to seed test users via API
    const response = await context.post('/api/test/seed-users');

    if (response.ok()) {
      const data = await response.json();
      console.log('Test users seeded successfully:');
      data.credentials?.forEach((user: { role: string; email: string }) => {
        console.log(`  - ${user.role}: ${user.email}`);
      });
    } else {
      console.log('Warning: Could not seed test users via API');
      console.log('Tests will create users dynamically if needed');
    }
  } catch (error) {
    console.log('Warning: Test user seeding failed');
    console.log('Tests will create users dynamically if needed');
  }

  // Store test user credentials in environment for tests
  process.env.TEST_USER_EMAIL = TEST_USERS[0].email;
  process.env.TEST_USER_PASSWORD = TEST_USERS[0].password;

  console.log('Global setup complete');
}

export default globalSetup;