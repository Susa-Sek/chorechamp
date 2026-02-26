import { Page } from '@playwright/test';

/**
 * Household helper functions for E2E tests
 */

/**
 * Create a new household
 */
export async function createHousehold(page: Page, name: string): Promise<string> {
  await page.goto('/household/create');

  await page.getByLabel(/haushaltsname|name/i).fill(name);
  await page.getByRole('button', { name: /erstellen|haushalt erstellen/i }).click();

  // Wait for redirect
  await page.waitForURL(/\/(dashboard|household\/)/, { timeout: 10000 });

  // Extract household ID from URL if available
  const url = page.url();
  const match = url.match(/household\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : '';
}

/**
 * Join a household using invite code
 */
export async function joinHousehold(page: Page, inviteCode: string): Promise<void> {
  await page.goto('/household/join');

  await page.getByLabel(/einladungscode|code/i).fill(inviteCode);
  await page.getByRole('button', { name: /beitreten/i }).click();

  // Wait for redirect to household or dashboard
  await page.waitForURL(/\/(dashboard|household)/, { timeout: 10000 });
}

/**
 * Get the invite code for current household
 */
export async function getInviteCode(page: Page): Promise<string> {
  await page.goto('/household');

  // Look for invite code display
  const codeElement = page.getByText(/[A-Z0-9]{6,}/).first();
  const code = await codeElement.textContent();

  return code?.match(/[A-Z0-9]{6,}/)?.[0] || '';
}

/**
 * Check if user is household admin
 */
export async function isHouseholdAdmin(page: Page): Promise<boolean> {
  await page.goto('/household');

  // Look for admin-specific elements
  const adminElements = [
    page.getByRole('button', { name: /mitglied entfernen/i }),
    page.getByRole('button', { name: /rolle ändern/i }),
    page.getByRole('button', { name: /bonuspunkte/i }),
  ];

  for (const element of adminElements) {
    if (await element.isVisible().catch(() => false)) {
      return true;
    }
  }

  return false;
}

/**
 * Get list of household members
 */
export async function getHouseholdMembers(page: Page): Promise<string[]> {
  await page.goto('/household');

  // Find all member names
  const memberElements = await page.locator('[data-testid="member-name"]').allTextContents();

  return memberElements;
}

/**
 * Remove a member from household (admin only)
 */
export async function removeMember(page: Page, memberName: string): Promise<void> {
  await page.goto('/household');

  // Find the member card
  const memberCard = page.locator(`text=${memberName}`).first().locator('xpath=..');

  // Click remove button
  await memberCard.getByRole('button', { name: /entfernen/i }).click();

  // Confirm removal
  await page.getByRole('button', { name: /bestätigen|entfernen/i }).last().click();
}

/**
 * Change member role (admin only)
 */
export async function changeMemberRole(page: Page, memberName: string, role: 'admin' | 'member'): Promise<void> {
  await page.goto('/household');

  // Find the member card
  const memberCard = page.locator(`text=${memberName}`).first().locator('xpath=..');

  // Click role change button
  await memberCard.getByRole('button', { name: /rolle|admin/i }).click();

  // Select new role
  await page.getByRole('option', { name: new RegExp(role, 'i') }).click();
}