import { test, expect } from '@playwright/test';

test.describe('PROJ-1: Responsive Design Tests', () => {
  test.describe('Mobile (375px)', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('landing page should be responsive on mobile', async ({ page }) => {
      await page.goto('/');

      // Page should render without horizontal scroll
      await expect(page.locator('body')).toBeVisible();

      // Check that content fits within viewport
      const bodyWidth = await page.locator('body').boundingBox();
      expect(bodyWidth?.width).toBeLessThanOrEqual(400);
    });

    test('login form should be responsive on mobile', async ({ page }) => {
      await page.goto('/auth/login');

      // Form should be visible and usable - German labels
      await expect(page.getByLabel('E-Mail')).toBeVisible();
      await expect(page.getByLabel('Passwort')).toBeVisible();
      await expect(page.getByRole('button', { name: /anmelden/i })).toBeVisible();

      // Form should fit within viewport
      const form = page.locator('form');
      if (await form.isVisible()) {
        const formBox = await form.boundingBox();
        expect(formBox?.width).toBeLessThanOrEqual(375);
      }
    });

    test('register form should be responsive on mobile', async ({ page }) => {
      await page.goto('/auth/register');

      // Form should be visible and usable - German labels
      await expect(page.getByLabel('Anzeigename')).toBeVisible();
      await expect(page.getByLabel('E-Mail')).toBeVisible();
      await expect(page.getByLabel('Passwort').first()).toBeVisible();
      await expect(page.getByLabel('Passwort bestätigen')).toBeVisible();
    });

    test('forgot password form should be responsive on mobile', async ({ page }) => {
      await page.goto('/auth/forgot-password');

      await expect(page.getByLabel(/e-mail/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /senden|zurücksetzen|passwort/i })).toBeVisible();
    });
  });

  test.describe('Tablet (768px)', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('landing page should be responsive on tablet', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('body')).toBeVisible();

      // Check that content is properly laid out
      const bodyWidth = await page.locator('body').boundingBox();
      expect(bodyWidth?.width).toBeLessThanOrEqual(800);
    });

    test('login form should be responsive on tablet', async ({ page }) => {
      await page.goto('/auth/login');

      await expect(page.getByLabel('E-Mail')).toBeVisible();
      await expect(page.getByRole('button', { name: /anmelden/i })).toBeVisible();
    });

    test('register form should be responsive on tablet', async ({ page }) => {
      await page.goto('/auth/register');

      await expect(page.getByLabel('Anzeigename')).toBeVisible();
      await expect(page.getByRole('button', { name: /konto erstellen/i })).toBeVisible();
    });
  });

  test.describe('Desktop (1440px)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('landing page should be responsive on desktop', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('body')).toBeVisible();

      // Content should be properly centered/sized
      const mainContent = page.locator('main, [role="main"]').first();
      if (await mainContent.isVisible()) {
        const contentBox = await mainContent.boundingBox();
        expect(contentBox?.width).toBeLessThanOrEqual(1440);
      }
    });

    test('login form should be responsive on desktop', async ({ page }) => {
      await page.goto('/auth/login');

      await expect(page.getByLabel('E-Mail')).toBeVisible();
      await expect(page.getByRole('button', { name: /anmelden/i })).toBeVisible();
    });

    test('register form should be responsive on desktop', async ({ page }) => {
      await page.goto('/auth/register');

      await expect(page.getByLabel('Anzeigename')).toBeVisible();
      await expect(page.getByRole('button', { name: /konto erstellen/i })).toBeVisible();
    });
  });
});