import { test, expect, Page } from '@playwright/test';
import { generateTestUser, TEST_USERS } from '../fixtures/test-users';
import { registerUser, loginUser, logoutUser } from '../utils/auth-helpers';

/**
 * PROJ-9: User Journey 1 - New User Registration & Onboarding
 */
test.describe('UJ-1: New User Registration & Onboarding', () => {
  test.describe.configure({ mode: 'serial' });

  test.describe('UJ-1.1: Complete Registration Flow', () => {
    test('should register new user successfully', async ({ page }) => {
      const user = generateTestUser('parent');

      // Step 1: Navigate to landing page
      await page.goto('/');

      // Step 2: Click "Registrieren" button
      const registerLink = page.getByRole('link', { name: /registrieren|konto erstellen/i });
      if (await registerLink.isVisible()) {
        await registerLink.click();
      } else {
        await page.goto('/auth/register');
      }

      // Step 3-6: Fill registration form
      await page.getByLabel(/anzeigename/i).fill(user.displayName);
      await page.getByLabel(/e-mail/i).fill(user.email);
      await page.getByLabel(/^passwort/i).fill(user.password);
      await page.getByLabel(/passwort bestätigen/i).fill(user.password);

      // Step 7: Click "Konto erstellen"
      await page.getByRole('button', { name: /konto erstellen/i }).click();

      // Step 8: Verify redirect to dashboard
      await page.waitForURL(/\/(dashboard|household)/, { timeout: 15000 });

      // Step 9-10: Verify profile created
      await expect(page.getByText(new RegExp(user.displayName, 'i'))).toBeVisible({ timeout: 5000 });
    });

    test('should show validation for duplicate email', async ({ page }) => {
      await page.goto('/auth/register');

      // Try to register with existing email
      await page.getByLabel(/anzeigename/i).fill('Duplicate User');
      await page.getByLabel(/e-mail/i).fill(TEST_USERS.parent.email);
      await page.getByLabel(/^passwort/i).fill('Test1234!');
      await page.getByLabel(/passwort bestätigen/i).fill('Test1234!');
      await page.getByRole('button', { name: /konto erstellen/i }).click();

      // Should show error for duplicate email
      await expect(page.getByText(/existiert bereits|schon vergeben/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show validation for weak password', async ({ page }) => {
      await page.goto('/auth/register');

      const user = generateTestUser('solo');
      await page.getByLabel(/anzeigename/i).fill(user.displayName);
      await page.getByLabel(/e-mail/i).fill(user.email);
      await page.getByLabel(/^passwort/i).fill('weak');
      await page.getByLabel(/passwort bestätigen/i).fill('weak');
      await page.getByRole('button', { name: /konto erstellen/i }).click();

      // Should show password strength error
      await expect(page.getByText(/mindestens 8|zu schwach/i)).toBeVisible({ timeout: 5000 });
    });

    test('should auto-create profile with display name', async ({ page }) => {
      const user = generateTestUser('child');
      await registerUser(page, user);

      // Verify profile created with display name
      await page.goto('/profile');
      await expect(page.getByText(new RegExp(user.displayName, 'i'))).toBeVisible({ timeout: 5000 });
    });

    test('should create point balance record (0 points)', async ({ page }) => {
      const user = generateTestUser('partner');
      await registerUser(page, user);

      // Check dashboard for point balance
      await page.goto('/dashboard');

      // Should show 0 points initially
      await expect(page.getByText(/0\s*(punkte|p)/i)).toBeVisible({ timeout: 5000 });
    });

    test('should create user level record (Level 1)', async ({ page }) => {
      const user = generateTestUser('solo');
      await registerUser(page, user);

      // Check for level indicator
      await page.goto('/dashboard');
      await expect(page.getByText(/level\s*1/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('UJ-1.2: Login Flow', () => {
    test('should login existing user successfully', async ({ page }) => {
      // This test requires a pre-existing user
      // Using test credentials from environment or defaults
      const email = process.env.TEST_USER_EMAIL || 'test@example.com';
      const password = process.env.TEST_USER_PASSWORD || 'Test1234!';

      await page.goto('/auth/login');
      await page.getByLabel(/e-mail/i).fill(email);
      await page.getByLabel(/passwort/i).fill(password);
      await page.getByRole('button', { name: /anmelden/i }).click();

      // Verify redirect to dashboard
      await page.waitForURL(/\/(dashboard|household)/, { timeout: 15000 });
    });

    test('should show loading state during auth', async ({ page }) => {
      const email = process.env.TEST_USER_EMAIL || 'test@example.com';
      const password = process.env.TEST_USER_PASSWORD || 'Test1234!';

      await page.goto('/auth/login');
      await page.getByLabel(/e-mail/i).fill(email);
      await page.getByLabel(/passwort/i).fill(password);

      const submitBtn = page.getByRole('button', { name: /anmelden/i });
      await submitBtn.click();

      // Button should show loading state (disabled or spinner)
      await expect(submitBtn).toBeDisabled({ timeout: 2000 });
    });

    test('should persist session on page refresh', async ({ page }) => {
      const email = process.env.TEST_USER_EMAIL || 'test@example.com';
      const password = process.env.TEST_USER_PASSWORD || 'Test1234!';

      await loginUser(page, { email, password, displayName: 'Test User' });

      // Refresh page
      await page.reload();

      // Should still be on dashboard (not redirected to login)
      await expect(page).toHaveURL(/\/(dashboard|household)/);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/login');
      await page.getByLabel(/e-mail/i).fill('nonexistent@test.com');
      await page.getByLabel(/passwort/i).fill('WrongPassword123!');
      await page.getByRole('button', { name: /anmelden/i }).click();

      // Should show error message
      await expect(page.getByText(/ungültig|falsch|fehlgeschlagen/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('UJ-1.3: Password Reset Flow', () => {
    test('should navigate to forgot password page', async ({ page }) => {
      await page.goto('/auth/login');
      await page.getByRole('link', { name: /passwort vergessen/i }).click();
      await expect(page).toHaveURL(/\/auth\/forgot-password/);
    });

    test('should send password reset email', async ({ page }) => {
      await page.goto('/auth/forgot-password');

      await page.getByLabel(/e-mail/i).fill('test@example.com');
      await page.getByRole('button', { name: /senden|zurücksetzen/i }).click();

      // Should show success message
      await expect(page.getByText(/gesendet|e-mail gesendet|überprüft/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('UJ-1.4: Logout Flow', () => {
    test('should logout user successfully', async ({ page }) => {
      const email = process.env.TEST_USER_EMAIL || 'test@example.com';
      const password = process.env.TEST_USER_PASSWORD || 'Test1234!';

      await loginUser(page, { email, password, displayName: 'Test User' });

      // Navigate to settings and logout
      await page.goto('/settings');
      const logoutBtn = page.getByRole('button', { name: /abmelden/i });

      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
      } else {
        // Alternative: clear session
        await page.context().clearCookies();
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/auth\/login/);
      }
    });
  });
});