const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = { tests: [], bugs: [], security: [], edgeCases: [] };

  // Helper function to wait for navigation
  const waitForNavigation = async (url) => {
    await page.waitForURL(url, { timeout: 10000 }).catch(() => {});
  };

  // TEST 1: Protected Route Access Without Auth
  console.log('TEST 1: Protected Route Access Without Auth');

  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/household',
    '/chores',
    '/chores/new',
    '/rewards',
    '/badges',
    '/leaderboard'
  ];

  for (const route of protectedRoutes) {
    await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const currentUrl = page.url();

    // Should redirect to login for unauthenticated users
    const isProtected = currentUrl.includes('/auth/login') || currentUrl.includes('/auth');
    results.tests.push({
      name: `Protected route ${route} requires auth`,
      passed: isProtected,
      details: `Redirected to: ${currentUrl}`
    });
  }

  // TEST 2: Household Creation Edge Cases (requires registration first)
  console.log('TEST 2: Registration and Login Flow');

  const testEmail = `edge-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  // Register new user
  await page.goto('http://localhost:3000/auth/register', { waitUntil: 'networkidle' });
  await page.fill('input[name="displayName"]', 'Edge Test User');
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  await page.locator('input[name="confirmPassword"]').fill(testPassword);
  await page.click('button[type="submit"]');

  // Wait for redirect after registration
  await page.waitForTimeout(3000);
  const afterRegUrl = page.url();
  console.log('After registration URL:', afterRegUrl);

  // Check if we're logged in
  const isLoggedIn = afterRegUrl.includes('dashboard') || afterRegUrl.includes('onboarding') || afterRegUrl.includes('household');
  results.tests.push({
    name: 'Registration successful and redirects',
    passed: isLoggedIn,
    details: `URL after registration: ${afterRegUrl}`
  });

  await page.screenshot({ path: '/root/ai-coding-starter-kit/chorechamp/test-results/edge-case-testing/07-after-registration.png' });

  // TEST 3: Test household name edge cases
  if (isLoggedIn || afterRegUrl.includes('household')) {
    console.log('TEST 3: Household Name Edge Cases');

    // Navigate to create household if needed
    if (afterRegUrl.includes('dashboard')) {
      await page.goto('http://localhost:3000/household/create', { waitUntil: 'networkidle' });
    }

    // Test very short name (should fail - minimum 3 chars)
    await page.fill('input[name="name"], input[placeholder*="Haushalt"]', 'AB');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    const shortNameError = await page.locator('.text-destructive, [role="alert"]').count();
    results.edgeCases.push({
      name: 'Household name minimum length validation',
      passed: shortNameError > 0,
      details: '2 character name should be rejected'
    });

    // Test maximum length (should fail - max 50 chars)
    await page.fill('input[name="name"], input[placeholder*="Haushalt"]', 'A'.repeat(51));
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    const longNameError = await page.locator('.text-destructive, [role="alert"]').count();
    results.edgeCases.push({
      name: 'Household name maximum length validation',
      passed: longNameError > 0,
      details: '51 character name should be rejected'
    });

    // Test special characters and emoji
    await page.fill('input[name="name"], input[placeholder*="Haushalt"]', 'Test Home 🏠 & Family');
    await page.screenshot({ path: '/root/ai-coding-starter-kit/chorechamp/test-results/edge-case-testing/08-household-emoji.png' });

    // Test valid name
    await page.fill('input[name="name"], input[placeholder*="Haushalt"]', 'Test Household ' + Date.now());
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/root/ai-coding-starter-kit/chorechamp/test-results/edge-case-testing/09-household-created.png' });
  }

  // TEST 4: Invite Code Edge Cases
  console.log('TEST 4: Invite Code Edge Cases');

  await page.goto('http://localhost:3000/household/join', { waitUntil: 'networkidle' });

  // Test invalid invite codes
  const invalidCodes = ['12345', '1234567', 'ABC!@#', '      ', 'abc def'];
  for (const code of invalidCodes) {
    await page.fill('input[name="code"], input[placeholder*="Code"]', code);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: '/root/ai-coding-starter-kit/chorechamp/test-results/edge-case-testing/10-invalid-invite-codes.png' });

  // TEST 5: Chore Creation Edge Cases
  console.log('TEST 5: Chore Creation Edge Cases');

  await page.goto('http://localhost:3000/chores/new', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const currentUrl = page.url();
  if (currentUrl.includes('chores/new')) {
    // Test empty form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    const emptyFormErrors = await page.locator('.text-destructive, [role="alert"]').count();
    results.edgeCases.push({
      name: 'Chore creation empty form validation',
      passed: emptyFormErrors > 0
    });

    // Test very long title (max 100 chars)
    await page.fill('input[name="title"]', 'A'.repeat(101));
    await page.waitForTimeout(300);
    const titleInput = await page.inputValue('input[name="title"]');
    results.edgeCases.push({
      name: 'Chore title max length',
      passed: titleInput.length <= 100,
      details: `Title length: ${titleInput.length}`
    });

    // Test XSS in chore fields
    await page.fill('input[name="title"]', '<script>alert("xss")</script>');
    await page.fill('textarea[name="description"]', '<img src=x onerror=alert("xss")>');
    await page.screenshot({ path: '/root/ai-coding-starter-kit/chorechamp/test-results/edge-case-testing/11-chore-xss.png' });

    // Test boundary values for points
    await page.fill('input[name="title"]', 'Test Chore');
    await page.fill('input[name="points"]', '0');
    await page.waitForTimeout(300);

    await page.fill('input[name="points"]', '101');
    await page.waitForTimeout(300);

    await page.fill('input[name="points"]', '-5');
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/root/ai-coding-starter-kit/chorechamp/test-results/edge-case-testing/12-chore-points-edge.png' });
  }

  // TEST 6: Rewards Edge Cases
  console.log('TEST 6: Rewards Edge Cases');

  await page.goto('http://localhost:3000/rewards', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/root/ai-coding-starter-kit/chorechamp/test-results/edge-case-testing/13-rewards-page.png' });

  // TEST 7: Badges Edge Cases
  console.log('TEST 7: Badges Edge Cases');

  await page.goto('http://localhost:3000/badges', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/root/ai-coding-starter-kit/chorechamp/test-results/edge-case-testing/14-badges-page.png' });

  // TEST 8: Profile Edge Cases
  console.log('TEST 8: Profile Edge Cases');

  await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Test profile name edge cases
  const nameInput = await page.locator('input[name="displayName"]').first();
  if (await nameInput.isVisible()) {
    // Test empty name (should fail)
    await nameInput.fill('');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/root/ai-coding-starter-kit/chorechamp/test-results/edge-case-testing/15-profile-empty.png' });

    // Test minimum name (1 char - should fail, min is 2)
    await nameInput.fill('A');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Test maximum name (50 chars - should fail if over)
    await nameInput.fill('A'.repeat(51));
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/root/ai-coding-starter-kit/chorechamp/test-results/edge-case-testing/16-profile-long.png' });
  }

  // TEST 9: Leaderboard Edge Cases
  console.log('TEST 9: Leaderboard Edge Cases');

  await page.goto('http://localhost:3000/leaderboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/root/ai-coding-starter-kit/chorechamp/test-results/edge-case-testing/17-leaderboard.png' });

  // TEST 10: Logout and Session Clear
  console.log('TEST 10: Logout and Session Clear');

  await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle' });

  // Find logout button
  const logoutButton = await page.locator('button:has-text("Abmelden"), button:has-text("Logout"), button:has-text("Sign out")').first();
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForTimeout(2000);
    const afterLogoutUrl = page.url();
    results.tests.push({
      name: 'Logout redirects to landing',
      passed: afterLogoutUrl === 'http://localhost:3000/' || afterLogoutUrl.includes('auth'),
      details: `URL after logout: ${afterLogoutUrl}`
    });

    // Check session is cleared
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const dashboardUrl = page.url();
    results.security.push({
      name: 'Session cleared after logout',
      passed: dashboardUrl.includes('auth') || !dashboardUrl.includes('dashboard'),
      details: `After logout, dashboard access redirected to: ${dashboardUrl}`
    });
  }

  console.log('\n=== RESULTS ===\n');
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
})();