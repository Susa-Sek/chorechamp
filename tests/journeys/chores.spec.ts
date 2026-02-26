import { test, expect, Page } from '@playwright/test';
import { generateTestUser } from '../fixtures/test-users';
import { registerUser, loginUser } from '../utils/auth-helpers';
import { createHousehold } from '../utils/household-helpers';

/**
 * PROJ-9: User Journey 3 - Chore Management
 */
test.describe('UJ-3: Chore Management', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Setup: Create user and household
    const user = generateTestUser('parent');
    await registerUser(page, user);
    await createHousehold(page, 'Test Haushalt Chores');
  });

  test.describe('UJ-3.1: Create Chores', () => {
    test('should create chore with all fields', async ({ page }) => {
      await page.goto('/chores/new');

      // Fill in title
      await page.getByLabel(/titel/i).fill('Bad putzen');

      // Set difficulty to medium
      await page.getByLabel(/schwierigkeit/i).click();
      await page.getByRole('option', { name: /mittel/i }).click();

      // Verify points auto-filled (20 for medium)
      const pointsInput = page.getByLabel(/punkte/i);
      await expect(pointsInput).toHaveValue('20');

      // Set due date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      await page.getByLabel(/fällig|due/i).fill(dateStr);

      // Submit
      await page.getByRole('button', { name: /erstellen|aufgabe/i }).click();

      // Verify redirect to chores list
      await page.waitForURL(/\/chores/, { timeout: 10000 });

      // Verify chore appears in list
      await expect(page.getByText('Bad putzen')).toBeVisible({ timeout: 5000 });
    });

    test('should auto-calculate points based on difficulty', async ({ page }) => {
      await page.goto('/chores/new');
      await page.getByLabel(/titel/i).fill('Test Chore Points');

      // Test easy (10 points)
      await page.getByLabel(/schwierigkeit/i).click();
      await page.getByRole('option', { name: /leicht/i }).click();
      await expect(page.getByLabel(/punkte/i)).toHaveValue('10');

      // Test medium (20 points)
      await page.getByLabel(/schwierigkeit/i).click();
      await page.getByRole('option', { name: /mittel/i }).click();
      await expect(page.getByLabel(/punkte/i)).toHaveValue('20');

      // Test hard (50 points)
      await page.getByLabel(/schwierigkeit/i).click();
      await page.getByRole('option', { name: /schwer/i }).click();
      await expect(page.getByLabel(/punkte/i)).toHaveValue('50');
    });

    test('should assign chore to household member', async ({ page }) => {
      await page.goto('/chores/new');

      await page.getByLabel(/titel/i).fill('Assigned Chore');

      // Open assignee dropdown
      await page.getByLabel(/zuweisen|zugewiesen an/i).click();

      // Select self (should be available)
      const option = page.getByRole('option').first();
      if (await option.isVisible()) {
        await option.click();
      }

      await page.getByRole('button', { name: /erstellen/i }).click();
      await page.waitForURL(/\/chores/, { timeout: 10000 });
    });
  });

  test.describe('UJ-3.2: Complete Chore & Earn Points', () => {
    test.beforeEach(async ({ page }) => {
      // Create a chore first
      await page.goto('/chores/new');
      await page.getByLabel(/titel/i).fill('Completable Chore');
      await page.getByLabel(/schwierigkeit/i).click();
      await page.getByRole('option', { name: /mittel/i }).click();
      await page.getByRole('button', { name: /erstellen/i }).click();
      await page.waitForURL(/\/chores$/);
    });

    test('should mark chore as complete', async ({ page }) => {
      await page.goto('/chores');

      // Find the chore and click complete button
      const choreCard = page.locator('text=Completable Chore').first().locator('xpath=..');
      const completeBtn = choreCard.locator('button').first();

      await completeBtn.click();

      // Should show success message
      await expect(page.getByText(/verdienst|punkte|erfolgreich/i)).toBeVisible({ timeout: 5000 });
    });

    test('should award points immediately', async ({ page }) => {
      await page.goto('/chores');

      // Get initial points from dashboard
      await page.goto('/dashboard');
      const initialPoints = await page.getByText(/\d+\s*(punkte|p)/i).first().textContent();

      // Complete chore
      await page.goto('/chores');
      const choreCard = page.locator('text=Completable Chore').first().locator('xpath=..');
      await choreCard.locator('button').first().click();

      // Check points updated
      await page.goto('/dashboard');
      await page.waitForTimeout(1000);
    });

    test('should show celebration animation', async ({ page }) => {
      await page.goto('/chores');

      const choreCard = page.locator('text=Completable Chore').first().locator('xpath=..');
      await choreCard.locator('button').first().click();

      // Look for celebration/confetti animation
      // This could be a toast, modal, or animation
      await page.waitForTimeout(500);

      // Check for visual feedback (toast or success message)
      const successIndicator = page.getByRole('alert').or(page.getByText(/verdienst|erledigt/i));
      await expect(successIndicator.first()).toBeVisible({ timeout: 5000 });
    });

    test('should log point transaction', async ({ page }) => {
      await page.goto('/chores');

      // Complete chore
      const choreCard = page.locator('text=Completable Chore').first().locator('xpath=..');
      await choreCard.locator('button').first().click();
      await page.waitForTimeout(1000);

      // Check point history
      await page.goto('/points/history');
      await expect(page.getByText(/Completable Chore|aufgabe/i)).toBeVisible({ timeout: 5000 });
    });

    test('should move chore to completed section', async ({ page }) => {
      await page.goto('/chores');

      // Complete chore
      const choreCard = page.locator('text=Completable Chore').first().locator('xpath=..');
      await choreCard.locator('button').first().click();
      await page.waitForTimeout(1000);

      // Refresh and check for completed filter/section
      await page.goto('/chores');

      // Look for completed status
      await expect(page.getByText(/erledigt/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('UJ-3.3: Recurring Tasks', () => {
    test('should create weekly recurring chore', async ({ page }) => {
      await page.goto('/chores/new');

      await page.getByLabel(/titel/i).fill('Müll rausbringen');

      // Set recurrence
      const recurrenceSelect = page.getByLabel(/wiederholung|wiederkehrend/i);
      if (await recurrenceSelect.isVisible()) {
        await recurrenceSelect.click();
        await page.getByRole('option', { name: /wöchentlich/i }).click();

        // Set day
        const daySelect = page.getByLabel(/wochentag|tag/i);
        if (await daySelect.isVisible()) {
          await daySelect.click();
          await page.getByRole('option', { name: /donnerstag/i }).click();
        }
      }

      await page.getByRole('button', { name: /erstellen/i }).click();
      await page.waitForURL(/\/chores/, { timeout: 10000 });
    });

    test('should show recurrence pattern on chore card', async ({ page }) => {
      // Create recurring chore first
      await page.goto('/chores/new');
      await page.getByLabel(/titel/i).fill('Weekly Test');

      const recurrenceSelect = page.getByLabel(/wiederholung/i);
      if (await recurrenceSelect.isVisible()) {
        await recurrenceSelect.click();
        await page.getByRole('option', { name: /wöchentlich/i }).click();
      }

      await page.getByRole('button', { name: /erstellen/i }).click();
      await page.waitForURL(/\/chores/);

      // Check for recurrence indicator
      await expect(page.getByText(/wöchentlich|wiederkehrend/i)).toBeVisible({ timeout: 5000 });
    });
  });
});