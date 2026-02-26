import { Page } from '@playwright/test';

/**
 * Household helper functions for E2E tests
 */

/**
 * Create a new household
 */
export async function createHousehold(page: Page, name: string): Promise<string> {
  await page.goto('/household/create');

  // Wait for form to be ready
  await page.waitForLoadState('networkidle');

  // Wait for the form input to be visible
  await page.waitForSelector('input', { timeout: 10000 });

  await page.getByLabel(/haushaltsname|name/i).fill(name);
  await page.getByRole('button', { name: /erstellen|haushalt erstellen/i }).click();

  // Wait for redirect to household page or dashboard
  await page.waitForURL(/\/(dashboard|household)/, { timeout: 15000 });

  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');

  // Wait for the household to be visible - look for the household name or member section
  // This ensures the household was created and the page is ready
  await page.waitForSelector('text=/' + name + '|Mitglieder|Haushalt/', { timeout: 15000 }).catch(() => {
    // If not found, wait a bit more for the household to load
    return page.waitForTimeout(2000);
  });

  // Additional wait for the household provider to update
  await page.waitForTimeout(1000);

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

  // Wait for form to be ready
  await page.waitForLoadState('networkidle');

  await page.getByLabel(/einladungscode|code/i).fill(inviteCode);
  await page.getByRole('button', { name: /beitreten/i }).click();

  // Wait for redirect to household or dashboard
  await page.waitForURL(/\/(dashboard|household)/, { timeout: 15000 });

  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
}

/**
 * Get the invite code for current household
 */
export async function getInviteCode(page: Page): Promise<string> {
  await page.goto('/household');

  // Wait for the page to load (not showing loading state)
  await page.waitForLoadState('networkidle');

  // Wait for either invite codes section or "Keine aktiven Einladungscodes" text
  // Also wait for admin elements to be visible (invite codes section is admin-only)
  await page.waitForSelector('text=/Einladungscodes|Keine aktiven Einladungscodes|Code erstellen|Mitglied/', { timeout: 15000 });

  // Additional wait for the invite codes section to render (admin-only)
  await page.waitForTimeout(1500);

  // Check if there are existing invite codes displayed
  // Use data-testid for reliable selection
  const codeElement = page.getByTestId('invite-code').first();
  const isVisible = await codeElement.isVisible().catch(() => false);

  if (isVisible) {
    const code = await codeElement.textContent();
    const match = code?.match(/[A-Z0-9]{6,}/);
    if (match) {
      return match[0];
    }
  }

  // Fallback: try code.font-mono selector
  const codeElementFallback = page.locator('code.font-mono').first();
  const isFallbackVisible = await codeElementFallback.isVisible().catch(() => false);

  if (isFallbackVisible) {
    const code = await codeElementFallback.textContent();
    const match = code?.match(/[A-Z0-9]{6,}/);
    if (match) {
      return match[0];
    }
  }

  // If no codes visible, we need to generate one
  // Look for "Code erstellen" button and click it
  const createCodeBtn = page.getByRole('button', { name: /code erstellen/i });
  if (await createCodeBtn.isVisible().catch(() => false)) {
    await createCodeBtn.click();

    // Wait for dialog to appear
    await page.waitForSelector('text=/Einladungscode erstellen|Neuen Code/', { timeout: 5000 });

    // Wait for the dialog to be fully rendered
    await page.waitForTimeout(500);

    // Click "Code erstellen" in the dialog (the button inside the dialog)
    const dialogCreateBtn = page.getByRole('button', { name: /^Code erstellen$/i }).first();
    await dialogCreateBtn.click();

    // Wait for the dialog to close and the new code to appear
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to get the code again - use both selectors
    const newCodeElement = page.getByTestId('invite-code').first();
    if (await newCodeElement.isVisible().catch(() => false)) {
      const code = await newCodeElement.textContent();
      const match = code?.match(/[A-Z0-9]{6,}/);
      if (match) {
        return match[0];
      }
    }

    // Fallback
    const newCodeElementFallback = page.locator('code.font-mono').first();
    if (await newCodeElementFallback.isVisible().catch(() => false)) {
      const code = await newCodeElementFallback.textContent();
      const match = code?.match(/[A-Z0-9]{6,}/);
      if (match) {
        return match[0];
      }
    }
  }

  return '';
}

/**
 * Check if user is household admin
 */
export async function isHouseholdAdmin(page: Page): Promise<boolean> {
  await page.goto('/household');

  // Wait for the page to load (not showing loading state)
  await page.waitForLoadState('networkidle');

  // Wait for the household content to load - look for member count or household name
  await page.waitForSelector('text=/Mitglied|Haushalt|Kein Haushalt/', { timeout: 15000 });

  // Additional wait for admin state to be determined (isAdmin is computed from household_members)
  await page.waitForTimeout(2000);

  // Look for admin-specific elements:
  // 1. "Du bist Admin" text (shown next to member count for admins)
  const adminText = page.getByText(/du bist admin/i);
  if (await adminText.isVisible().catch(() => false)) {
    return true;
  }

  // 2. "Einladen" button (visible only to admins)
  const inviteBtn = page.getByRole('button', { name: /einladen/i });
  if (await inviteBtn.isVisible().catch(() => false)) {
    return true;
  }

  // 3. "Einladungscodes" section header (visible only to admins)
  const inviteCodesSection = page.getByRole('heading', { name: /einladungscodes/i });
  if (await inviteCodesSection.isVisible().catch(() => false)) {
    return true;
  }

  // 4. "Bonuspunkte vergeben" button (visible only to admins)
  const bonusBtn = page.getByRole('button', { name: /bonuspunkte/i });
  if (await bonusBtn.isVisible().catch(() => false)) {
    return true;
  }

  // 5. Check for admin badge text anywhere on the page
  const adminBadge = page.locator('text=/Admin.*\\|.*Du bist Admin/i');
  if (await adminBadge.isVisible().catch(() => false)) {
    return true;
  }

  // 6. Look for dropdown menu on member cards (admin-only feature)
  const moreButtons = page.getByRole('button').filter({ hasText: '' }).filter({ has: page.locator('svg') });
  const memberCardButtons = await moreButtons.count();
  if (memberCardButtons > 0) {
    // Additional check: if we can see member options, we're admin
    const firstBtn = moreButtons.first();
    const ariaLabel = await firstBtn.getAttribute('aria-label').catch(() => null);
    if (ariaLabel?.includes('option')) {
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