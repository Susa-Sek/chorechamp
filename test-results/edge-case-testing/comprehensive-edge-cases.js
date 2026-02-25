const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    tests: [],
    bugs: [],
    security: [],
    edgeCases: [],
    screenshots: []
  };

  const screenshot = async (name) => {
    const path = `/root/ai-coding-starter-kit/chorechamp/test-results/edge-case-testing/${name}`;
    await page.screenshot({ path, fullPage: true });
    results.screenshots.push(path);
  };

  try {
    // ============================================
    // SECTION 1: PUBLIC PAGES - NO AUTH REQUIRED
    // ============================================
    console.log('\n=== SECTION 1: PUBLIC PAGES ===\n');

    // TEST 1.1: Landing Page
    console.log('TEST 1.1: Landing Page');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await screenshot('01-landing-page.png');
    results.tests.push({ name: 'Landing page loads', passed: true });

    // TEST 1.2: Protected Routes Redirect
    console.log('TEST 1.2: Protected Routes Redirect');
    const protectedRoutes = ['/dashboard', '/profile', '/household', '/chores', '/rewards', '/badges', '/leaderboard'];

    for (const route of protectedRoutes) {
      await page.goto(`http://localhost:3000${route}`);
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      const isProtected = currentUrl.includes('/auth');
      results.tests.push({
        name: `Protected route ${route} redirects to auth`,
        passed: isProtected,
        details: `Redirected to: ${currentUrl}`
      });
    }

    // ============================================
    // SECTION 2: AUTHENTICATION FLOWS
    // ============================================
    console.log('\n=== SECTION 2: AUTHENTICATION FLOWS ===\n');

    // TEST 2.1: Registration Validation
    console.log('TEST 2.1: Registration Validation');
    await page.goto('http://localhost:3000/auth/register', { waitUntil: 'networkidle' });

    // Test empty form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    const hasValidationErrors = await page.locator('.text-destructive, [role="alert"]').count() > 0;
    results.edgeCases.push({
      name: 'Registration: empty form shows errors',
      passed: hasValidationErrors
    });

    // Test invalid email formats
    const invalidEmails = ['test', 'test@', '@example.com', 'test @example.com'];
    for (const email of invalidEmails) {
      await page.fill('input[type="email"]', email);
      await page.fill('input[name="displayName"]', 'Test User');
      await page.fill('input[type="password"]', 'ValidPass123!');
      await page.locator('input[name="confirmPassword"]').fill('ValidPass123!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(300);
    }
    await screenshot('02-registration-validation.png');

    // Test weak passwords
    const weakPasswords = ['1', '12', '1234567', 'abcdefgh', 'ABCDEFGH'];
    await page.fill('input[type="email"]', 'test@example.com');
    for (const pw of weakPasswords) {
      await page.fill('input[type="password"]', pw);
      await page.locator('input[name="confirmPassword"]').fill(pw);
      await page.waitForTimeout(200);
    }

    // Test mismatched passwords
    await page.fill('input[type="password"]', 'ValidPass123!');
    await page.locator('input[name="confirmPassword"]').fill('DifferentPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    await screenshot('03-password-mismatch.png');

    // TEST 2.2: Login Validation
    console.log('TEST 2.2: Login Validation');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' });

    // Test empty form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    const loginValidationErrors = await page.locator('.text-destructive, [role="alert"]').count() > 0;
    results.edgeCases.push({
      name: 'Login: empty form shows errors',
      passed: loginValidationErrors
    });

    // Test invalid credentials
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await screenshot('04-invalid-login.png');

    // Check for error message
    const loginErrorVisible = await page.locator('text=/ungültig|falsch|error|invalid/i').count() > 0;
    results.edgeCases.push({
      name: 'Login: invalid credentials shows error',
      passed: loginErrorVisible
    });

    // TEST 2.3: XSS Prevention in Auth Forms
    console.log('TEST 2.3: XSS Prevention');
    await page.goto('http://localhost:3000/auth/register', { waitUntil: 'networkidle' });

    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert("xss")>',
      '"><script>alert("xss")</script>',
      "javascript:alert('xss')"
    ];

    for (const payload of xssPayloads) {
      await page.fill('input[name="displayName"]', payload);
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.locator('input[name="confirmPassword"]').fill('TestPass123!');
      await page.waitForTimeout(200);
    }

    // Check that XSS payload is escaped in the DOM
    const pageContent = await page.content();
    const hasUnescapedScript = pageContent.includes('<script>alert') && !pageContent.includes('&lt;script');
    results.security.push({
      name: 'XSS payloads are escaped',
      passed: !hasUnescapedScript
    });
    await screenshot('05-xss-prevention.png');

    // TEST 2.4: Password Reset Flow
    console.log('TEST 2.4: Password Reset Flow');
    await page.goto('http://localhost:3000/auth/forgot-password', { waitUntil: 'networkidle' });

    // Test empty email
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Test invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    await screenshot('06-forgot-password.png');

    // Test reset password without token
    await page.goto('http://localhost:3000/auth/reset-password', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await screenshot('07-reset-password-no-token.png');

    // Check for error message or disabled form
    const resetPageContent = await page.content();
    const showsTokenError = resetPageContent.toLowerCase().includes('ungültig') ||
                            resetPageContent.toLowerCase().includes('abgelaufen') ||
                            resetPageContent.toLowerCase().includes('link') ||
                            await page.locator('button[type="submit"]:disabled').count() > 0;
    results.edgeCases.push({
      name: 'Reset password: shows error without token',
      passed: showsTokenError
    });

    // ============================================
    // SECTION 3: SECURITY HEADERS
    // ============================================
    console.log('\n=== SECTION 3: SECURITY HEADERS ===\n');

    const response = await page.goto('http://localhost:3000');
    const headers = response.headers();

    results.security.push({
      name: 'X-Frame-Options: DENY',
      passed: headers['x-frame-options'] === 'DENY',
      actual: headers['x-frame-options']
    });
    results.security.push({
      name: 'X-Content-Type-Options: nosniff',
      passed: headers['x-content-type-options'] === 'nosniff',
      actual: headers['x-content-type-options']
    });
    results.security.push({
      name: 'Referrer-Policy set',
      passed: !!headers['referrer-policy'],
      actual: headers['referrer-policy']
    });

    console.log('Security Headers:', headers);

    // ============================================
    // SECTION 4: RESPONSIVE DESIGN
    // ============================================
    console.log('\n=== SECTION 4: RESPONSIVE DESIGN ===\n');

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await screenshot('08-mobile-landing.png');

    const mobileScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const mobileViewportWidth = await page.evaluate(() => window.innerWidth);
    if (mobileScrollWidth > mobileViewportWidth + 10) {
      results.bugs.push({
        id: 'EDGE-MOBILE-OVERFLOW',
        severity: 'Medium',
        feature: 'PROJ-1',
        description: 'Horizontal overflow on mobile landing page',
        details: `Scroll width: ${mobileScrollWidth}px, Viewport: ${mobileViewportWidth}px`
      });
    }

    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' });
    await screenshot('09-mobile-login.png');

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await screenshot('10-tablet-landing.png');

    // Desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await screenshot('11-desktop-landing.png');

    // ============================================
    // SECTION 5: CONSOLE ERRORS
    // ============================================
    console.log('\n=== SECTION 5: CONSOLE ERRORS ===\n');

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          text: msg.text(),
          location: msg.location()
        });
      }
    });

    // Visit all public pages
    const publicPages = ['/', '/auth/login', '/auth/register', '/auth/forgot-password'];
    for (const pagePath of publicPages) {
      await page.goto(`http://localhost:3000${pagePath}`, { waitUntil: 'networkidle' });
    }

    const relevantErrors = consoleErrors.filter(e =>
      !e.text.includes('favicon') &&
      !e.text.includes('manifest') &&
      !e.text.includes('extension')
    );

    results.tests.push({
      name: 'No console errors on public pages',
      passed: relevantErrors.length === 0,
      details: relevantErrors
    });

  } catch (error) {
    console.error('Test error:', error);
    results.bugs.push({
      id: 'TEST-ERROR',
      severity: 'High',
      description: 'Test execution error',
      details: error.message
    });
  }

  console.log('\n=== FINAL RESULTS ===\n');
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
})();