const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const results = { tests: [], bugs: [], security: [] };

  // TEST 1: Landing Page Responsive Check
  console.log('TEST 1: Landing Page Responsive Check');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/root/ai-coding-starter-kit/chorechamp/test-results/edge-case-testing/01-mobile-landing.png' });

  // Check for horizontal overflow
  const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  if (bodyScrollWidth > viewportWidth) {
    results.bugs.push({
      id: 'EDGE-RESPONSIVE-1',
      severity: 'Medium',
      feature: 'PROJ-1',
      description: 'Horizontal overflow on mobile landing page',
      details: `Body scroll width (${bodyScrollWidth}px) exceeds viewport (${viewportWidth}px)`
    });
  }
  results.tests.push({ name: 'Mobile landing page loads', passed: true });

  // TEST 2: Registration Form Edge Cases
  console.log('TEST 2: Registration Form Edge Cases');
  await page.goto('http://localhost:3000/auth/register', { waitUntil: 'networkidle' });
  await page.setViewportSize({ width: 1440, height: 900 });

  // Test empty form submission
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
  const emptyFormErrors = await page.locator('[role="alert"], .text-destructive, .text-red-500').count();
  results.tests.push({ name: 'Registration empty form validation', passed: emptyFormErrors > 0 });

  // Test very long input values
  await page.fill('input[name="displayName"]', 'A'.repeat(100));
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'Test123!');
  const confirmPasswordInput = await page.locator('input[name="confirmPassword"]').first();
  await confirmPasswordInput.fill('Test123!');
  await page.screenshot({ path: '/root/ai-coding-starter-kit/chorechamp/test-results/edge-case-testing/02-long-input.png' });

  // TEST 3: XSS Prevention
  console.log('TEST 3: XSS Prevention');
  await page.goto('http://localhost:3000/auth/register', { waitUntil: 'networkidle' });

  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert("xss")>',
    'javascript:alert("xss")',
    '<svg onload=alert("xss")>',
  ];

  for (const payload of xssPayloads) {
    await page.fill('input[name="displayName"]', payload);
    await page.waitForTimeout(200);
  }

  await page.screenshot({ path: '/root/ai-coding-starter-kit/chorechamp/test-results/edge-case-testing/03-xss-test.png' });

  // TEST 4: SQL Injection Prevention (in login)
  console.log('TEST 4: SQL Injection Prevention');
  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' });

  const sqlInjections = [
    "' OR '1'='1",
    "'; DROP TABLE users;--",
    "admin'--",
    "1' OR '1' = '1'"
  ];

  for (const injection of sqlInjections) {
    await page.fill('input[type="email"]', injection);
    await page.fill('input[type="password"]', injection);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
  }

  // Check no SQL error messages leaked
  const pageContent = await page.content();
  const hasSqlError = pageContent.toLowerCase().includes('sql') &&
                       (pageContent.toLowerCase().includes('error') || pageContent.toLowerCase().includes('syntax'));
  results.security.push({ name: 'SQL injection error not leaked', passed: !hasSqlError });

  await page.screenshot({ path: '/root/ai-coding-starter-kit/chorechamp/test-results/edge-case-testing/04-sql-injection.png' });

  // TEST 5: Password Reset Edge Cases
  console.log('TEST 5: Password Reset Edge Cases');
  await page.goto('http://localhost:3000/auth/forgot-password', { waitUntil: 'networkidle' });

  // Test invalid email
  await page.fill('input[type="email"]', 'nonexistent@example.com');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/root/ai-coding-starter-kit/chorechamp/test-results/edge-case-testing/05-password-reset.png' });

  // TEST 6: Reset Password Without Token
  console.log('TEST 6: Reset Password Without Token');
  await page.goto('http://localhost:3000/auth/reset-password', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const errorVisible = await page.locator('text=ungültig, text=abgelaufen, text=Neuen Link').count() > 0;
  results.tests.push({ name: 'Reset password shows error without token', passed: errorVisible });

  await page.screenshot({ path: '/root/ai-coding-starter-kit/chorechamp/test-results/edge-case-testing/06-reset-no-token.png' });

  // TEST 7: Check Security Headers
  console.log('TEST 7: Security Headers');
  const response = await page.goto('http://localhost:3000');
  const headers = response.headers();

  const securityHeaders = {
    'x-frame-options': headers['x-frame-options'],
    'x-content-type-options': headers['x-content-type-options'],
    'referrer-policy': headers['referrer-policy'],
    'x-xss-protection': headers['x-xss-protection'],
  };

  results.security.push({ name: 'X-Frame-Options header', passed: securityHeaders['x-frame-options'] === 'DENY' });
  results.security.push({ name: 'X-Content-Type-Options header', passed: securityHeaders['x-content-type-options'] === 'nosniff' });

  console.log('Security Headers:', securityHeaders);

  // TEST 8: Console Error Check
  console.log('TEST 8: Console Error Check');
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' });
  await page.goto('http://localhost:3000/auth/register', { waitUntil: 'networkidle' });

  results.tests.push({
    name: 'No console errors on auth pages',
    passed: consoleErrors.filter(e => !e.includes('favicon')).length === 0,
    details: consoleErrors
  });

  console.log('\n=== RESULTS ===\n');
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
})();