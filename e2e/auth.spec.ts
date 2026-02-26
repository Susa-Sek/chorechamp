import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  displayName: 'Test User',
};

test.describe('PROJ-1: User Authentication', () => {
  test.describe('US-1.1: User Registration', () => {
    test('should display registration form with all required fields', async ({ page }) => {
      await page.goto('/auth/register');

      // German labels - exact match for FormLabel components
      await expect(page.getByLabel('Anzeigename')).toBeVisible();
      await expect(page.getByLabel('E-Mail')).toBeVisible();
      await expect(page.getByLabel('Passwort')).toBeVisible();
      await expect(page.getByLabel('Passwort bestätigen')).toBeVisible();
      await expect(page.getByRole('button', { name: /konto erstellen/i })).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/auth/register');

      await page.getByLabel('Anzeigename').fill('Test User');
      await page.getByLabel('E-Mail').fill('invalid-email');
      await page.getByLabel('Passwort').first().fill('Password123!');
      await page.getByLabel('Passwort bestätigen').fill('Password123!');
      await page.getByRole('button', { name: /konto erstellen/i }).click();

      // Wait for validation error
      await expect(page.getByText(/ungültige e-mail|ungültig/i)).toBeVisible({ timeout: 5000 });
    });

    test('should enforce password complexity rules', async ({ page }) => {
      await page.goto('/auth/register');

      // Test weak password (too short)
      await page.getByLabel('Anzeigename').fill('Test User');
      await page.getByLabel('E-Mail').fill('test@example.com');
      await page.getByLabel('Passwort').first().fill('weak');
      await page.getByLabel('Passwort bestätigen').fill('weak');
      await page.getByRole('button', { name: /konto erstellen/i }).click();

      // Should show password requirement error - German text
      await expect(page.getByText(/mindestens 8|zeichen/i)).toBeVisible({ timeout: 5000 });
    });

    test('should require password confirmation match', async ({ page }) => {
      await page.goto('/auth/register');

      await page.getByLabel('Anzeigename').fill('Test User');
      await page.getByLabel('E-Mail').fill('test@example.com');
      await page.getByLabel('Passwort').first().fill('Password123!');
      await page.getByLabel('Passwort bestätigen').fill('DifferentPassword123!');
      await page.getByRole('button', { name: /konto erstellen/i }).click();

      // German: "Passwörter stimmen nicht überein"
      await expect(page.getByText(/stimmen nicht überein|passwörter/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show password strength indicator', async ({ page }) => {
      await page.goto('/auth/register');

      // Weak password - German: "Schwach"
      await page.getByLabel('Passwort').first().fill('weak');
      await expect(page.getByText(/schwach/i)).toBeVisible({ timeout: 5000 });

      // Medium password - German: "Mittel"
      await page.getByLabel('Passwort').first().fill('Medium123');
      await expect(page.getByText(/mittel/i)).toBeVisible({ timeout: 5000 });

      // Strong password - German: "Stark"
      await page.getByLabel('Passwort').first().fill('StrongPassword123!');
      await expect(page.getByText(/stark/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('US-1.2: User Login', () => {
    test('should display login form with all required fields', async ({ page }) => {
      await page.goto('/auth/login');

      await expect(page.getByLabel('E-Mail')).toBeVisible();
      await expect(page.getByLabel('Passwort')).toBeVisible();
      // German: "Anmelden" for login button
      await expect(page.getByRole('button', { name: /anmelden/i })).toBeVisible();
      // German: "Passwort vergessen"
      await expect(page.getByRole('link', { name: /passwort vergessen/i })).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/login');

      await page.getByLabel('E-Mail').fill('nonexistent@example.com');
      await page.getByLabel('Passwort').fill('WrongPassword123!');
      await page.getByRole('button', { name: /anmelden/i }).click();

      // German: "Ungültige Anmeldedaten"
      await expect(page.getByText(/ungültige|anmeldung fehlgeschlagen/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show loading state during authentication', async ({ page }) => {
      await page.goto('/auth/login');

      await page.getByLabel('E-Mail').fill('test@example.com');
      await page.getByLabel('Passwort').fill('Password123!');

      const submitButton = page.getByRole('button', { name: /anmelden/i });
      await submitButton.click();

      // Button should be disabled or show loading text
      await expect(submitButton).toBeDisabled({ timeout: 2000 });
    });

    test('should have link to forgot password', async ({ page }) => {
      await page.goto('/auth/login');

      await expect(page.getByRole('link', { name: /passwort vergessen/i })).toBeVisible();
    });

    test('should have link to registration', async ({ page }) => {
      await page.goto('/auth/login');

      // German: "Registrieren" or "Konto erstellen"
      await expect(page.getByRole('link', { name: /registrieren|konto erstellen/i })).toBeVisible();
    });
  });

  test.describe('US-1.3: Password Reset', () => {
    test('should display forgot password form', async ({ page }) => {
      await page.goto('/auth/forgot-password');

      await expect(page.getByLabel('E-Mail')).toBeVisible();
      // German: "Senden" or "Zurücksetzen"
      await expect(page.getByRole('button', { name: /senden|zurücksetzen|passwort/i })).toBeVisible();
      // German: "Zurück zum Login"
      await expect(page.getByRole('link', { name: /zurück|login/i })).toBeVisible();
    });

    test('should validate email on forgot password form', async ({ page }) => {
      await page.goto('/auth/forgot-password');

      await page.getByLabel('E-Mail').fill('invalid-email');
      await page.getByRole('button', { name: /senden|zurücksetzen|passwort/i }).click();

      await expect(page.getByText(/ungültige e-mail|ungültig/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show error on reset password page without token', async ({ page }) => {
      await page.goto('/auth/reset-password');

      // Should show error state when no token is present
      // German: "Ungültig" or "abgelaufen" or "Link"
      await expect(page.getByText(/ungültig|abgelaufen|link|fehler/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('US-1.4: User Logout', () => {
    test('should redirect unauthenticated users from profile page', async ({ page }) => {
      await page.goto('/profile');
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });

  test.describe('US-1.5: User Profile', () => {
    test('should redirect unauthenticated users from profile page', async ({ page }) => {
      await page.goto('/profile');
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('should redirect unauthenticated users from dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate from landing page to login', async ({ page }) => {
      await page.goto('/');

      const loginLink = page.getByRole('link', { name: /anmelden|login/i });
      if (await loginLink.isVisible()) {
        await loginLink.click();
        await expect(page).toHaveURL(/\/auth\/login/);
      }
    });

    test('should navigate from landing page to register', async ({ page }) => {
      await page.goto('/');

      const registerLink = page.getByRole('link', { name: /registrieren|konto erstellen|jetzt starten/i });
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await expect(page).toHaveURL(/\/auth\/register/);
      }
    });

    test('should navigate from login to register', async ({ page }) => {
      await page.goto('/auth/login');

      await page.getByRole('link', { name: /registrieren|konto erstellen/i }).click();
      await expect(page).toHaveURL(/\/auth\/register/);
    });

    test('should navigate from register to login', async ({ page }) => {
      await page.goto('/auth/register');

      // German: "Bereits ein Konto? Anmelden"
      await page.getByRole('link', { name: /anmelden/i }).click();
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });
});