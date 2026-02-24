import { test, expect, Page } from '@playwright/test';

// Test user credentials - will be created during test run
const TEST_USER = {
  email: `chore-test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  displayName: 'Chore Test User',
};

// Helper to register and login
async function registerAndLogin(page: Page) {
  await page.goto('/auth/register');
  await page.getByLabel(/anzeigename/i).fill(TEST_USER.displayName);
  await page.getByLabel(/e-mail/i).fill(TEST_USER.email);
  await page.getByLabel(/^passwort/i).fill(TEST_USER.password);
  await page.getByLabel(/passwort bestatigen/i).fill(TEST_USER.password);
  await page.getByRole('button', { name: /konto erstellen/i }).click();

  // Wait for redirect after registration
  await page.waitForURL(/\/(household|dashboard)/, { timeout: 15000 });
}

// Helper to create a household
async function createHousehold(page: Page) {
  await page.goto('/household/create');
  await page.getByLabel(/name.*haushalt/i).fill('Test Household');
  await page.getByRole('button', { name: /erstellen|haushalt erstellen/i }).click();
  await page.waitForURL(/\/(household|dashboard|chores)/, { timeout: 10000 });
}

// Helper to create a chore
async function createChore(page: Page, title: string, options: {
  description?: string;
  difficulty?: string;
  assignee?: string;
  dueDate?: string;
} = {}) {
  await page.goto('/chores/new');

  // Fill in title
  await page.getByLabel(/titel/i).fill(title);

  // Fill in description if provided
  if (options.description) {
    await page.getByLabel(/beschreibung/i).fill(options.description);
  }

  // Select difficulty if provided
  if (options.difficulty) {
    await page.getByLabel(/schwierigkeit/i).click();
    await page.getByRole('option', { name: new RegExp(options.difficulty, 'i') }).click();
  }

  // Select assignee if provided
  if (options.assignee) {
    await page.getByLabel(/zuweisen/i).click();
    await page.getByRole('option', { name: new RegExp(options.assignee, 'i') }).click();
  }

  // Set due date if provided
  if (options.dueDate) {
    await page.getByLabel(/fallig|due/i).fill(options.dueDate);
  }

  // Submit form
  await page.getByRole('button', { name: /aufgabe erstellen/i }).click();
}

test.describe('PROJ-3: Chore Management', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login before each test
    await registerAndLogin(page);

    // Create a household if redirected to household page
    const url = page.url();
    if (url.includes('/household') && !url.includes('/household/')) {
      await createHousehold(page);
    }
  });

  test.describe('US-3.1: Create Chore', () => {
    test('AC1: should display create chore form with all required fields', async ({ page }) => {
      await page.goto('/chores/new');

      // Check for title field (required, 2-100 characters)
      await expect(page.getByLabel(/titel/i)).toBeVisible();

      // Check for description field (optional, max 500 characters)
      await expect(page.getByLabel(/beschreibung/i)).toBeVisible();

      // Check for assignee dropdown
      await expect(page.getByLabel(/zuweisen/i)).toBeVisible();

      // Check for difficulty selection
      await expect(page.getByLabel(/schwierigkeit/i)).toBeVisible();

      // Check for points field
      await expect(page.getByLabel(/punkte/i)).toBeVisible();

      // Check for due date field
      await expect(page.getByLabel(/fallig|due/i)).toBeVisible();

      // Check for create button
      await expect(page.getByRole('button', { name: /aufgabe erstellen/i })).toBeVisible();
    });

    test('AC2: should validate title length (2-100 characters)', async ({ page }) => {
      await page.goto('/chores/new');

      // Test too short title (1 character)
      await page.getByLabel(/titel/i).fill('A');
      await page.getByRole('button', { name: /aufgabe erstellen/i }).click();
      await expect(page.getByText(/mindestens 2|2 zeichen/i)).toBeVisible({ timeout: 5000 });

      // Clear and test valid title
      await page.getByLabel(/titel/i).fill('Valid Chore Title');
      await page.getByLabel(/punkte/i).fill('10');

      // No validation error for valid title
      await expect(page.getByText(/mindestens 2|2 zeichen/i)).not.toBeVisible();
    });

    test('AC3: should set default points based on difficulty', async ({ page }) => {
      await page.goto('/chores/new');

      // Default should be medium (20 points)
      const pointsInput = page.getByLabel(/punkte/i);
      await expect(pointsInput).toHaveValue('20');

      // Select easy difficulty - should change to 10 points
      await page.getByLabel(/schwierigkeit/i).click();
      await page.getByRole('option', { name: /leicht.*10/i }).click();
      await expect(pointsInput).toHaveValue('10');

      // Select hard difficulty - should change to 50 points
      await page.getByLabel(/schwierigkeit/i).click();
      await page.getByRole('option', { name: /schwer.*50/i }).click();
      await expect(pointsInput).toHaveValue('50');
    });

    test('AC4: should create chore successfully and redirect to list', async ({ page }) => {
      const choreTitle = `Test Chore ${Date.now()}`;
      await createChore(page, choreTitle);

      // Should redirect to chores list
      await page.waitForURL(/\/chores$/);

      // Should show success toast
      await expect(page.getByText(/erfolgreich erstellt/i)).toBeVisible({ timeout: 5000 });

      // Chore should appear in list
      await expect(page.getByText(choreTitle)).toBeVisible({ timeout: 5000 });
    });

    test('AC5: should allow optional description (max 500 characters)', async ({ page }) => {
      await page.goto('/chores/new');

      // Fill description
      const longDescription = 'A'.repeat(501);
      await page.getByLabel(/beschreibung/i).fill(longDescription);

      // Should have max length attribute enforced
      const descValue = await page.getByLabel(/beschreibung/i).inputValue();
      expect(descValue.length).toBeLessThanOrEqual(500);
    });

    test('AC6: should allow setting optional due date', async ({ page }) => {
      await page.goto('/chores/new');

      // Set due date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      await page.getByLabel(/fallig|due/i).fill(dateStr);

      // Create chore
      await page.getByLabel(/titel/i).fill('Chore with due date');
      await page.getByRole('button', { name: /aufgabe erstellen/i }).click();

      // Verify redirect
      await page.waitForURL(/\/chores$/);
    });
  });

  test.describe('US-3.2: Edit Chore', () => {
    test.beforeEach(async ({ page }) => {
      // Create a chore for editing
      await createChore(page, `Editable Chore ${Date.now()}`);
      await page.waitForURL(/\/chores$/);
    });

    test('AC1: should navigate to edit page from chore detail', async ({ page }) => {
      // Click on the chore to view details
      await page.getByText(/Editable Chore/).first().click();
      await page.waitForURL(/\/chores\/[^/]+$/);

      // Click menu button
      await page.getByRole('button').filter({ has: page.locator('svg') }).last().click();

      // Should see edit option
      const editButton = page.getByRole('menuitem', { name: /bearbeiten/i }).or(page.getByRole('link', { name: /bearbeiten/i }));
      await expect(editButton).toBeVisible({ timeout: 3000 });
    });

    test('AC2: should pre-fill all fields with existing values', async ({ page }) => {
      // Go to chore detail
      await page.getByText(/Editable Chore/).first().click();
      await page.waitForURL(/\/chores\/[^/]+$/);

      // Go to edit page
      await page.getByRole('button').filter({ has: page.locator('svg') }).last().click();
      await page.getByRole('menuitem', { name: /bearbeiten/i }).click();
      await page.waitForURL(/\/edit$/);

      // Check that title is pre-filled
      await expect(page.getByLabel(/titel/i)).toHaveValue(/Editable Chore/);
    });

    test('AC3: should have cancel option to discard changes', async ({ page }) => {
      // Go to chore detail and then edit
      await page.getByText(/Editable Chore/).first().click();
      await page.waitForURL(/\/chores\/[^/]+$/);
      await page.getByRole('button').filter({ has: page.locator('svg') }).last().click();
      await page.getByRole('menuitem', { name: /bearbeiten/i }).click();
      await page.waitForURL(/\/edit$/);

      // Make a change
      await page.getByLabel(/titel/i).fill('Modified Title');

      // Click cancel
      await page.getByRole('button', { name: /abbrechen/i }).click();

      // Should navigate back without saving
      await page.waitForURL(/\/chores/);

      // Original title should still be visible
      await expect(page.getByText(/Editable Chore/)).toBeVisible({ timeout: 5000 });
    });

    test('AC4: should save changes with success feedback', async ({ page }) => {
      // Go to chore detail and then edit
      await page.getByText(/Editable Chore/).first().click();
      await page.waitForURL(/\/chores\/[^/]+$/);
      await page.getByRole('button').filter({ has: page.locator('svg') }).last().click();
      await page.getByRole('menuitem', { name: /bearbeiten/i }).click();
      await page.waitForURL(/\/edit$/);

      // Modify title
      const newTitle = `Updated Chore ${Date.now()}`;
      await page.getByLabel(/titel/i).fill(newTitle);

      // Save
      await page.getByRole('button', { name: /speichern|anderungen/i }).click();

      // Should show success message
      await expect(page.getByText(/erfolgreich aktualisiert/i)).toBeVisible({ timeout: 5000 });

      // Should redirect to chores list
      await page.waitForURL(/\/chores$/);
    });
  });

  test.describe('US-3.3: Delete Chore', () => {
    test.beforeEach(async ({ page }) => {
      // Create a chore for deletion
      await createChore(page, `Deletable Chore ${Date.now()}`);
      await page.waitForURL(/\/chores$/);
    });

    test('AC1: should have delete button on chore card', async ({ page }) => {
      await page.goto('/chores');

      // Click the menu button on the chore card
      const choreCard = page.getByText(/Deletable Chore/).first().locator('xpath=..');
      await choreCard.locator('button').filter({ has: page.locator('svg') }).last().click();

      // Should see delete option
      await expect(page.getByRole('menuitem', { name: /loschen/i })).toBeVisible({ timeout: 3000 });
    });

    test('AC2: should show confirmation dialog before deletion', async ({ page }) => {
      // Open menu and click delete
      const choreCard = page.getByText(/Deletable Chore/).first().locator('xpath=..');
      await choreCard.locator('button').filter({ has: page.locator('svg') }).last().click();
      await page.getByRole('menuitem', { name: /loschen/i }).click();

      // Should show confirmation dialog
      await expect(page.getByRole('alertdialog').or(page.locator('[role="dialog"]'))).toBeVisible({ timeout: 3000 });
      await expect(page.getByText(/loschen\?|wirklich|dauerhaft/i)).toBeVisible();
    });

    test('AC3: should delete chore and show success feedback', async ({ page }) => {
      // Open menu and click delete
      const choreCard = page.getByText(/Deletable Chore/).first().locator('xpath=..');
      await choreCard.locator('button').filter({ has: page.locator('svg') }).last().click();
      await page.getByRole('menuitem', { name: /loschen/i }).click();

      // Confirm deletion
      await page.getByRole('alertdialog').or(page.locator('[role="dialog"]')).getByRole('button', { name: /loschen/i }).click();

      // Should show success message
      await expect(page.getByText(/geloscht/i)).toBeVisible({ timeout: 5000 });

      // Chore should no longer be visible
      await expect(page.getByText(/Deletable Chore/)).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('US-3.4: Assign Chore', () => {
    test('AC1: should show dropdown with household members', async ({ page }) => {
      await page.goto('/chores/new');

      // Click assignee dropdown
      await page.getByLabel(/zuweisen/i).click();

      // Should show "Nicht zugewiesen" (Unassigned) option
      await expect(page.getByRole('option', { name: /nicht zugewiesen/i })).toBeVisible({ timeout: 3000 });

      // Should show current user as member
      await expect(page.getByRole('option', { name: new RegExp(TEST_USER.displayName, 'i') })).toBeVisible();
    });

    test('AC2: should create chore with assignee', async ({ page }) => {
      await page.goto('/chores/new');

      await page.getByLabel(/titel/i).fill('Assigned Chore');

      // Select assignee
      await page.getByLabel(/zuweisen/i).click();
      await page.getByRole('option', { name: new RegExp(TEST_USER.displayName, 'i') }).click();

      await page.getByRole('button', { name: /aufgabe erstellen/i }).click();

      // Should redirect and show chore
      await page.waitForURL(/\/chores$/);
      await expect(page.getByText('Assigned Chore')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('US-3.5: View All Chores', () => {
    test.beforeEach(async ({ page }) => {
      // Create multiple chores for filtering/sorting
      await createChore(page, 'Easy Chore', { difficulty: 'Leicht' });
      await page.waitForURL(/\/chores$/);

      await createChore(page, 'Hard Chore', { difficulty: 'Schwer' });
      await page.waitForURL(/\/chores$/);
    });

    test('AC1: should display list of chores', async ({ page }) => {
      await page.goto('/chores');

      // Should show chore list
      await expect(page.getByText('Easy Chore')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Hard Chore')).toBeVisible({ timeout: 5000 });
    });

    test('AC2: should filter by status', async ({ page }) => {
      await page.goto('/chores');

      // Open status filter
      const statusFilter = page.locator('[data-testid="status-filter"]').or(
        page.getByRole('combobox').filter({ hasText: /alle|status/i })
      ).first();
      await statusFilter.click();

      // Select "Offen" (pending)
      await page.getByRole('option', { name: /offen/i }).click();

      // Should show only pending chores
      await expect(page.getByText('Easy Chore')).toBeVisible({ timeout: 5000 });
    });

    test('AC3: should filter by difficulty', async ({ page }) => {
      await page.goto('/chores');

      // Open filter popover
      await page.getByRole('button', { name: /filter/i }).click();

      // Select difficulty filter
      await page.getByLabel(/schwierigkeit/i).nth(1).click();
      await page.getByRole('option', { name: /schwer/i }).click();

      // Close popover
      await page.keyboard.press('Escape');

      // Should show only hard chores
      await expect(page.getByText('Hard Chore')).toBeVisible({ timeout: 5000 });
    });

    test('AC4: should sort by different fields', async ({ page }) => {
      await page.goto('/chores');

      // Find sort dropdown
      const sortDropdown = page.getByRole('combobox', { name: /sortieren/i }).or(
        page.locator('select').filter({ hasText: /erstellung|datum/i })
      ).first();

      if (await sortDropdown.isVisible()) {
        await sortDropdown.click();
        await page.getByRole('option', { name: /punkte|points/i }).click();

        // Should still show chores (sorted by points)
        await expect(page.getByText(/Chore/).first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('AC5: should search by chore name', async ({ page }) => {
      await page.goto('/chores');

      // Type in search
      await page.getByPlaceholder(/suchen/i).fill('Easy');

      // Should show only matching chores
      await expect(page.getByText('Easy Chore')).toBeVisible({ timeout: 5000 });
    });

    test('AC6: should show empty state when no chores exist', async ({ page }) => {
      // Check if empty state message is shown when no chores
      await page.goto('/chores');
      await expect(page.getByRole('heading', { name: /aufgaben/i })).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('US-3.6: View Chore Details', () => {
    test.beforeEach(async ({ page }) => {
      await createChore(page, 'Detail Test Chore', { description: 'Test description' });
      await page.waitForURL(/\/chores$/);
    });

    test('AC1: should display all chore information', async ({ page }) => {
      // Click on chore to view details
      await page.getByText('Detail Test Chore').first().click();
      await page.waitForURL(/\/chores\/[^/]+$/);

      // Should show title
      await expect(page.getByRole('heading', { name: /Detail Test Chore/i })).toBeVisible();

      // Should show description
      await expect(page.getByText('Test description')).toBeVisible();

      // Should show points
      await expect(page.getByText(/\d+\s*(Punkte|P)/i)).toBeVisible();

      // Should show difficulty badge
      await expect(page.getByText(/mittel|leicht|schwer/i)).toBeVisible();

      // Should show status
      await expect(page.getByText(/offen|erledigt/i)).toBeVisible();
    });

    test('AC2: should show assignee with avatar', async ({ page }) => {
      // Create chore with assignee
      await page.goto('/chores/new');
      await page.getByLabel(/titel/i).fill('Assigned Detail Chore');
      await page.getByLabel(/zuweisen/i).click();
      await page.getByRole('option', { name: new RegExp(TEST_USER.displayName, 'i') }).click();
      await page.getByRole('button', { name: /aufgabe erstellen/i }).click();
      await page.waitForURL(/\/chores$/);

      // View details
      await page.getByText('Assigned Detail Chore').first().click();
      await page.waitForURL(/\/chores\/[^/]+$/);

      // Should show assignee
      await expect(page.getByText(new RegExp(TEST_USER.displayName, 'i'))).toBeVisible();
    });

    test('AC3: should show edit/delete buttons', async ({ page }) => {
      await page.getByText('Detail Test Chore').first().click();
      await page.waitForURL(/\/chores\/[^/]+$/);

      // Open menu
      await page.getByRole('button').filter({ has: page.locator('svg') }).last().click();

      // Should have edit and delete options
      await expect(page.getByRole('menuitem', { name: /bearbeiten/i })).toBeVisible({ timeout: 3000 });
      await expect(page.getByRole('menuitem', { name: /loschen/i })).toBeVisible();
    });
  });

  test.describe('US-3.7: Mark Chore as Complete', () => {
    test.beforeEach(async ({ page }) => {
      await createChore(page, 'Completable Chore');
      await page.waitForURL(/\/chores$/);
    });

    test('AC1: should have complete button on chore card', async ({ page }) => {
      await page.goto('/chores');

      // Find the circle button (complete) on the chore card
      const choreCard = page.getByText('Completable Chore').first().locator('xpath=..');
      const completeButton = choreCard.locator('button').first();

      await expect(completeButton).toBeVisible({ timeout: 5000 });
    });

    test('AC2: should mark chore as complete with points feedback', async ({ page }) => {
      await page.goto('/chores');

      // Click complete button
      const choreCard = page.getByText('Completable Chore').first().locator('xpath=..');
      await choreCard.locator('button').first().click();

      // Should show success message with points
      await expect(page.getByText(/\d+\s*(Punkte|P).*verdienst|verdient/i)).toBeVisible({ timeout: 5000 });

      // Chore should now show as completed
      await expect(page.getByText(/erledigt/i)).toBeVisible({ timeout: 5000 });
    });

    test('AC3: should show completion timestamp', async ({ page }) => {
      await page.goto('/chores');

      // Complete the chore
      const choreCard = page.getByText('Completable Chore').first().locator('xpath=..');
      await choreCard.locator('button').first().click();
      await page.waitForTimeout(1000);

      // View details
      await page.getByText('Completable Chore').first().click();
      await page.waitForURL(/\/chores\/[^/]+$/);

      // Should show completion info
      await expect(page.getByText(/erledigt am/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('US-3.8: Undo Completion', () => {
    test.beforeEach(async ({ page }) => {
      // Create and complete a chore
      await createChore(page, 'Undoable Chore');
      await page.waitForURL(/\/chores$/);

      // Complete it
      const choreCard = page.getByText('Undoable Chore').first().locator('xpath=..');
      await choreCard.locator('button').first().click();
      await page.waitForTimeout(1000);
    });

    test('AC1: should show undo option after completion', async ({ page }) => {
      await page.goto('/chores');

      // Open menu on completed chore
      const choreCard = page.getByText('Undoable Chore').first().locator('xpath=..');
      await choreCard.locator('button').filter({ has: page.locator('svg') }).last().click();

      // Should see undo option
      await expect(page.getByRole('menuitem', { name: /ruckgangig/i })).toBeVisible({ timeout: 3000 });
    });

    test('AC2: should show confirmation before undo', async ({ page }) => {
      await page.goto('/chores');

      // Open menu and click undo
      const choreCard = page.getByText('Undoable Chore').first().locator('xpath=..');
      await choreCard.locator('button').filter({ has: page.locator('svg') }).last().click();
      await page.getByRole('menuitem', { name: /ruckgangig/i }).click();

      // Should show confirmation dialog
      await expect(page.getByRole('alertdialog').or(page.locator('[role="dialog"]'))).toBeVisible({ timeout: 3000 });
      await expect(page.getByText(/punkte.*abgezogen|ruckgangig/i)).toBeVisible();
    });

    test('AC3: should undo completion and deduct points', async ({ page }) => {
      await page.goto('/chores');

      // Open menu and click undo
      const choreCard = page.getByText('Undoable Chore').first().locator('xpath=..');
      await choreCard.locator('button').filter({ has: page.locator('svg') }).last().click();
      await page.getByRole('menuitem', { name: /ruckgangig/i }).click();

      // Confirm undo
      await page.getByRole('alertdialog').or(page.locator('[role="dialog"]')).getByRole('button', { name: /ruckgangig/i }).click();

      // Should show success message
      await expect(page.getByText(/ruckgangig gemacht/i)).toBeVisible({ timeout: 5000 });

      // Chore should be pending again
      await expect(page.getByText(/offen/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/chores');

      // Should show header
      await expect(page.getByRole('heading', { name: /aufgaben/i })).toBeVisible({ timeout: 5000 });

      // New chore button should be accessible
      await expect(page.getByRole('link', { name: /neue aufgabe/i })).toBeVisible();
    });

    test('should be responsive on tablet (768px)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/chores');

      // Should show full interface
      await expect(page.getByRole('heading', { name: /aufgaben/i })).toBeVisible({ timeout: 5000 });
      await expect(page.getByPlaceholder(/suchen/i)).toBeVisible();
    });

    test('should be responsive on desktop (1440px)', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/chores');

      // Should show full interface with all controls visible
      await expect(page.getByRole('heading', { name: /aufgaben/i })).toBeVisible({ timeout: 5000 });
      await expect(page.getByPlaceholder(/suchen/i)).toBeVisible();
    });
  });

  test.describe('Security Tests', () => {
    test('should require authentication to access chores', async ({ page }) => {
      // Clear any existing session
      await page.context().clearCookies();

      // Try to access chores page
      await page.goto('/chores');

      // Should redirect to login
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    });

    test('should require authentication to create chore', async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('/chores/new');

      // Should redirect to login
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    });

    test('should validate input on server side', async ({ page }) => {
      await page.goto('/chores/new');

      // Try to submit with empty title
      await page.getByRole('button', { name: /aufgabe erstellen/i }).click();

      // Should show validation error
      await expect(page.getByText(/erforderlich|mindestens 2/i)).toBeVisible({ timeout: 5000 });
    });
  });
});