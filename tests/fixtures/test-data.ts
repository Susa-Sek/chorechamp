import { test as base, Page } from '@playwright/test';

/**
 * Test fixtures for E2E tests
 */

export interface TestFixtures {
  authenticatedPage: Page;
  householdPage: Page;
}

/**
 * Extended test with authentication fixture
 */
export const test = base.extend<TestFixtures>({
  // Automatically authenticate before each test
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto('/auth/login');

    // Use test credentials
    const email = process.env.TEST_USER_EMAIL || `test-${Date.now()}@test.com`;
    const password = process.env.TEST_USER_PASSWORD || 'Test1234!';

    await page.getByLabel(/e-mail/i).fill(email);
    await page.getByLabel(/passwort/i).fill(password);
    await page.getByRole('button', { name: /anmelden/i }).click();

    // Wait for redirect to dashboard or household
    await page.waitForURL(/\/(dashboard|household)/, { timeout: 15000 });

    await use(page);
  },

  // Page with household already created
  householdPage: async ({ page }, use) => {
    // Login first
    await page.goto('/auth/login');
    const email = process.env.TEST_USER_EMAIL || `test-${Date.now()}@test.com`;
    const password = process.env.TEST_USER_PASSWORD || 'Test1234!';

    await page.getByLabel(/e-mail/i).fill(email);
    await page.getByLabel(/passwort/i).fill(password);
    await page.getByRole('button', { name: /anmelden/i }).click();

    await page.waitForURL(/\/(dashboard|household)/, { timeout: 15000 });

    // Check if we need to create a household
    const currentUrl = page.url();
    if (currentUrl.includes('/household') && !currentUrl.includes('/household/')) {
      // Create household
      const createBtn = page.getByRole('button', { name: /haushalt erstellen/i });
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.getByLabel(/haushaltsname|name/i).fill('Test Haushalt');
        await page.getByRole('button', { name: /erstellen/i }).click();
        await page.waitForURL(/\/(dashboard|household\/)/, { timeout: 10000 });
      }
    }

    await use(page);
  },
});

export { expect } from '@playwright/test';