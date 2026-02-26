import { Page, BrowserContext } from '@playwright/test';

/**
 * Authentication helper functions for E2E tests
 */

export interface TestUser {
  email: string;
  password: string;
  displayName: string;
}

// Pre-defined test users for E2E testing
export const TEST_USERS = {
  parent: {
    email: 'parent@test.com',
    password: 'Test1234!',
    displayName: 'Test Parent',
  },
  child: {
    email: 'child@test.com',
    password: 'Test1234!',
    displayName: 'Test Child',
  },
  partner: {
    email: 'partner@test.com',
    password: 'Test1234!',
    displayName: 'Test Partner',
  },
  solo: {
    email: 'solo@test.com',
    password: 'Test1234!',
    displayName: 'Test Solo',
  },
};

/**
 * Register a new user via UI
 */
export async function registerUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/auth/register');
  await page.waitForLoadState('networkidle');

  // Fill registration form using label selectors
  await page.getByLabel('Anzeigename').fill(user.displayName);
  await page.getByLabel('E-Mail').fill(user.email);

  // Password fields - use more specific selectors
  const passwordInputs = page.locator('input[type="password"]');
  await passwordInputs.first().fill(user.password);
  await passwordInputs.last().fill(user.password);

  // Submit form
  await page.getByRole('button', { name: /konto erstellen/i }).click();

  // Wait for redirect after registration
  await page.waitForURL(/\/(dashboard|household)/, { timeout: 20000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Login an existing user via UI
 */
export async function loginUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('E-Mail').fill(user.email);
  await page.locator('input[type="password"]').fill(user.password);
  await page.getByRole('button', { name: /anmelden/i }).click();

  // Wait for redirect
  await page.waitForURL(/\/(dashboard|household)/, { timeout: 20000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Login via API (faster for tests that just need auth)
 * This sets the auth cookies directly without going through the UI
 */
export async function loginViaApi(
  context: BrowserContext,
  user: TestUser
): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error('Missing Supabase environment variables');
    return false;
  }

  try {
    // Call Supabase auth endpoint
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
      }),
    });

    if (!response.ok) {
      console.error(`Login failed for ${user.email}: ${response.statusText}`);
      return false;
    }

    const data = await response.json();

    // Set auth cookies
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: data.access_token,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
      {
        name: 'sb-refresh-token',
        value: data.refresh_token,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    return true;
  } catch (error) {
    console.error('API login error:', error);
    return false;
  }
}

/**
 * Logout the current user
 */
export async function logoutUser(page: Page): Promise<void> {
  // Try settings page first
  await page.goto('/settings');
  await page.waitForLoadState('networkidle');

  const logoutBtn = page.getByRole('button', { name: /abmelden/i });
  if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await logoutBtn.click();
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    return;
  }

  // Fallback: clear cookies and storage
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('/');
}

/**
 * Check if user is authenticated by checking current URL
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  const url = page.url();
  return !url.includes('/auth/');
}

/**
 * Wait for auth state to settle
 */
export async function waitForAuth(page: Page, timeout = 10000): Promise<void> {
  // Wait for either dashboard content or redirect to login
  try {
    await page.waitForURL(/\/(dashboard|household|auth\/login)/, { timeout });
    await page.waitForLoadState('networkidle');
  } catch {
    // Timeout is okay - just continue
  }
}

/**
 * Get the current user's display name from the UI
 */
export async function getDisplayName(page: Page): Promise<string | null> {
  try {
    // Try header first
    const headerName = await page.locator('header').getByText(/Test Parent|Test Child|Test Partner|Test Solo/i).first().textContent();
    if (headerName) return headerName;

    // Try profile section
    const profileName = await page.getByText(/willkommen zurück|hallo/i).first().textContent();
    return profileName;
  } catch {
    return null;
  }
}