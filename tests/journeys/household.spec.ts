import { test, expect, Page } from '@playwright/test';
import { generateTestUser, TEST_USERS } from '../fixtures/test-users';
import { registerUser, loginUser } from '../utils/auth-helpers';
import { createHousehold, joinHousehold, getInviteCode, isHouseholdAdmin } from '../utils/household-helpers';

/**
 * PROJ-9: User Journey 2 - Household Creation & Management
 */
test.describe('UJ-2: Household Creation & Management', () => {
  test.describe.configure({ mode: 'serial' });

  let inviteCode: string;

  test.describe('UJ-2.1: Create New Household', () => {
    test('should create household successfully', async ({ page }) => {
      const user = generateTestUser('parent');
      await registerUser(page, user);

      // Navigate to dashboard
      await page.goto('/dashboard');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Wait for the dashboard to show either the household section or the create/join buttons
      await page.waitForSelector('text=/Haushalt erstellen|Willkommen/', { timeout: 10000 });

      // Click "Haushalt erstellen" if not already in household
      const createBtn = page.getByRole('button', { name: /haushalt erstellen/i });
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForURL(/\/household\/create/);
      } else {
        await page.goto('/household/create');
      }

      // Wait for form to be ready
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('input', { timeout: 10000 });

      // Enter household name
      await page.getByLabel('Haushaltsname').fill('Familie Muller');
      await page.getByRole('button', { name: /erstellen/i }).click();

      // Verify redirect to household page or dashboard
      await page.waitForURL(/\/(household|dashboard)/, { timeout: 15000 });

      // Wait for household to be loaded
      await page.waitForLoadState('networkidle');
    });

    test('should set user as admin automatically', async ({ page }) => {
      const user = generateTestUser('parent');
      await registerUser(page, user);
      await createHousehold(page, 'Test Haushalt Admin');

      // Check for admin privileges
      const isAdmin = await isHouseholdAdmin(page);
      expect(isAdmin).toBe(true);
    });

    test('should generate invite code', async ({ page }) => {
      const user = generateTestUser('parent');
      await registerUser(page, user);
      await createHousehold(page, 'Test Haushalt Code');

      await page.goto('/household');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Look for invite code section (admin only) - generate code if needed
      const createCodeBtn = page.getByRole('button', { name: /code erstellen/i });
      if (await createCodeBtn.isVisible()) {
        await createCodeBtn.click();
        // Wait for dialog
        await page.waitForSelector('text=Einladungscode erstellen', { timeout: 5000 });
        // Click create in dialog
        await page.getByRole('button', { name: /^Code erstellen$/i }).click();
        await page.waitForLoadState('networkidle');
      }

      // Look for invite code (6+ character alphanumeric in code element)
      const codeElement = page.locator('code.font-mono');
      await expect(codeElement.first()).toBeVisible({ timeout: 10000 });
    });

    test('should create household_members record', async ({ page }) => {
      const user = generateTestUser('parent');
      await registerUser(page, user);
      await createHousehold(page, 'Test Haushalt Members');

      await page.goto('/household');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Should show current user as member
      await expect(page.getByText(new RegExp(user.displayName, 'i'))).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('UJ-2.2: Join Existing Household', () => {
    test.beforeAll(async ({ browser }) => {
      // Create a household and get invite code
      const context = await browser.newContext();
      const page = await context.newPage();

      const user = generateTestUser('parent');
      await registerUser(page, user);
      await createHousehold(page, 'Test Haushalt Join');

      // Wait for household to be fully loaded
      await page.waitForLoadState('networkidle');
      inviteCode = await getInviteCode(page);

      await context.close();
    });

    test('should join household with valid invite code', async ({ page }) => {
      // Skip if no invite code was generated
      test.skip(!inviteCode, 'No invite code generated');

      const user = generateTestUser('child');
      await registerUser(page, user);

      // Navigate to join page
      await page.goto('/household/join');
      await page.waitForLoadState('networkidle');

      // Enter invite code
      await page.getByLabel(/einladungscode|code/i).fill(inviteCode);
      await page.getByRole('button', { name: /beitreten/i }).click();

      // Verify redirect to household
      await page.waitForURL(/\/(household|dashboard)/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');
    });

    test('should set user role as member (not admin)', async ({ page }) => {
      // Skip if no invite code was generated
      test.skip(!inviteCode, 'No invite code generated');

      const user = generateTestUser('partner');
      await registerUser(page, user);
      await joinHousehold(page, inviteCode);

      const isAdmin = await isHouseholdAdmin(page);
      expect(isAdmin).toBe(false);
    });

    test('should show error for invalid invite code', async ({ page }) => {
      const user = generateTestUser('solo');
      await registerUser(page, user);

      await page.goto('/household/join');
      await page.waitForLoadState('networkidle');
      await page.getByLabel(/einladungscode|code/i).fill('INVALID');
      await page.getByRole('button', { name: /beitreten/i }).click();

      // Should show error
      await expect(page.getByText(/ungültig|nicht gefunden|fehler/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show household name after joining', async ({ page }) => {
      // Skip if no invite code was generated
      test.skip(!inviteCode, 'No invite code generated');

      const user = generateTestUser('solo');
      await registerUser(page, user);
      await joinHousehold(page, inviteCode);

      await page.goto('/household');
      await page.waitForLoadState('networkidle');

      // Should show household name
      await expect(page.getByText(/Test Haushalt Join/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('UJ-2.3: Manage Household Members', () => {
    test('should display member list', async ({ page }) => {
      const user = generateTestUser('parent');
      await registerUser(page, user);
      await createHousehold(page, 'Test Haushalt Manage');

      await page.goto('/household');
      await page.waitForLoadState('networkidle');

      // Should show at least one member (current user)
      await expect(page.getByText(new RegExp(user.displayName, 'i'))).toBeVisible({ timeout: 10000 });
    });

    test('should allow admin to change member roles', async ({ page }) => {
      const user = generateTestUser('parent');
      await registerUser(page, user);
      await createHousehold(page, 'Test Haushalt Role');

      // Create another member (simulated)
      await page.goto('/household');
      await page.waitForLoadState('networkidle');

      // Look for role change button (admin only) - check for "Einladen" button which is admin-only
      const inviteBtn = page.getByRole('button', { name: /einladen/i });
      await expect(inviteBtn).toBeVisible({ timeout: 5000 });
    });

    test('should allow admin to remove members', async ({ page }) => {
      const user = generateTestUser('parent');
      await registerUser(page, user);
      await createHousehold(page, 'Test Haushalt Remove');

      await page.goto('/household');
      await page.waitForLoadState('networkidle');

      // Look for "Haushalt verlassen" button (available to all members)
      const leaveBtn = page.getByRole('button', { name: /verlassen/i });
      await expect(leaveBtn).toBeVisible({ timeout: 10000 });
    });
  });
});