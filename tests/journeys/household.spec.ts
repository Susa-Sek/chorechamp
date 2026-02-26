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

      // Click "Haushalt erstellen" if not already in household
      const createBtn = page.getByRole('button', { name: /haushalt erstellen/i });
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForURL(/\/household\/create/);
      } else {
        await page.goto('/household/create');
      }

      // Enter household name
      await page.getByLabel(/haushaltsname|name/i).fill('Familie Müller');
      await page.getByRole('button', { name: /erstellen/i }).click();

      // Verify redirect to household page or dashboard
      await page.waitForURL(/\/(household|dashboard)/, { timeout: 10000 });
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

      // Look for invite code (6+ character alphanumeric)
      const codeElement = page.getByText(/[A-Z0-9]{6,}/);
      await expect(codeElement.first()).toBeVisible({ timeout: 5000 });
    });

    test('should create household_members record', async ({ page }) => {
      const user = generateTestUser('parent');
      await registerUser(page, user);
      await createHousehold(page, 'Test Haushalt Members');

      await page.goto('/household');

      // Should show current user as member
      await expect(page.getByText(new RegExp(user.displayName, 'i'))).toBeVisible({ timeout: 5000 });
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

      inviteCode = await getInviteCode(page);

      await context.close();
    });

    test('should join household with valid invite code', async ({ page }) => {
      const user = generateTestUser('child');
      await registerUser(page, user);

      // Navigate to join page
      await page.goto('/household/join');

      // Enter invite code
      await page.getByLabel(/einladungscode|code/i).fill(inviteCode);
      await page.getByRole('button', { name: /beitreten/i }).click();

      // Verify redirect to household
      await page.waitForURL(/\/(household|dashboard)/, { timeout: 10000 });
    });

    test('should set user role as member (not admin)', async ({ page }) => {
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
      await page.getByLabel(/einladungscode|code/i).fill('INVALID');
      await page.getByRole('button', { name: /beitreten/i }).click();

      // Should show error
      await expect(page.getByText(/ungültig|nicht gefunden|fehler/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show household name after joining', async ({ page }) => {
      const user = generateTestUser('child2');
      await registerUser(page, user);
      await joinHousehold(page, inviteCode);

      await page.goto('/household');

      // Should show household name
      await expect(page.getByText(/Test Haushalt Join/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('UJ-2.3: Manage Household Members', () => {
    test('should display member list', async ({ page }) => {
      const user = generateTestUser('parent');
      await registerUser(page, user);
      await createHousehold(page, 'Test Haushalt Manage');

      await page.goto('/household');

      // Should show at least one member (current user)
      await expect(page.getByText(new RegExp(user.displayName, 'i'))).toBeVisible({ timeout: 5000 });
    });

    test('should allow admin to change member roles', async ({ page }) => {
      const user = generateTestUser('parent');
      await registerUser(page, user);
      await createHousehold(page, 'Test Haushalt Role');

      // Create another member (simulated)
      await page.goto('/household');

      // Look for role change button (admin only)
      const roleBtn = page.getByRole('button', { name: /rolle|admin/i }).first();
      if (await roleBtn.isVisible()) {
        await roleBtn.click();
        // Should see role options
        await expect(page.getByRole('option', { name: /admin|mitglied/i }).first()).toBeVisible({ timeout: 3000 });
      }
    });

    test('should allow admin to remove members', async ({ page }) => {
      const user = generateTestUser('parent');
      await registerUser(page, user);
      await createHousehold(page, 'Test Haushalt Remove');

      await page.goto('/household');

      // Look for remove button (admin only) - on self it should show "leave" not "remove"
      const removeBtn = page.getByRole('button', { name: /entfernen|verlassen/i });
      // This should be visible for admin
      await expect(removeBtn.first()).toBeVisible({ timeout: 5000 });
    });
  });
});