import { Page } from '@playwright/test';

/**
 * Authentication helper functions for E2E tests
 */

export interface TestUser {
  email: string;
  password: string;
  displayName: string;
}

/**
 * Register a new user
 */
export async function registerUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/auth/register');

  // Use placeholder-based selectors which are more reliable with shadcn/ui forms
  await page.getByPlaceholder(/dein name|name/i).fill(user.displayName);
  await page.getByPlaceholder(/@|email/i).fill(user.email);
  await page.getByPlaceholder(/••••••••|passwort/i).first().fill(user.password);
  await page.getByPlaceholder(/bestätigen/i).fill(user.password);
  await page.getByRole('button', { name: /konto erstellen/i }).click();

  // Wait for redirect after registration
  await page.waitForURL(/\/(dashboard|household)/, { timeout: 15000 });
}

/**
 * Login an existing user
 */
export async function loginUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/auth/login');

  await page.getByPlaceholder(/@|email/i).fill(user.email);
  await page.getByPlaceholder(/••••••••|passwort/i).fill(user.password);
  await page.getByRole('button', { name: /anmelden/i }).click();

  // Wait for redirect
  await page.waitForURL(/\/(dashboard|household)/, { timeout: 15000 });
}

/**
 * Logout the current user
 */
export async function logoutUser(page: Page): Promise<void> {
  // Navigate to profile or find logout button
  await page.goto('/settings');

  // Look for logout button (German: "Abmelden")
  const logoutBtn = page.getByRole('button', { name: /abmelden/i });
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    return;
  }

  // Alternative: clear cookies
  await page.context().clearCookies();
  await page.goto('/auth/login');
}

/**
 * Get current user session info
 */
export async function getCurrentUser(page: Page): Promise<{ email: string; displayName: string } | null> {
  await page.goto('/profile');

  try {
    const displayName = await page.getByText(/hallo|willkommen/i).first().textContent();
    return { email: '', displayName: displayName || '' };
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  await page.goto('/dashboard');
  const url = page.url();
  return !url.includes('/auth/login');
}