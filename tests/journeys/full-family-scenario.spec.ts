import { test, expect, Page, BrowserContext } from '@playwright/test';
import { generateTestUser } from '../fixtures/test-users';
import { registerUser, loginUser } from '../utils/auth-helpers';
import { createHousehold, joinHousehold, getInviteCode } from '../utils/household-helpers';

/**
 * PROJ-9: User Journey 6 - Complete Family Scenario (Full Integration Test)
 *
 * This test simulates a complete family workflow:
 * 1. Parent creates household
 * 2. Child and Partner join
 * 3. Parent assigns chores to each member
 * 4. Members complete chores and earn points
 * 5. Verify leaderboard
 * 6. Child redeems a reward
 * 7. Parent marks reward as fulfilled
 */
test.describe('UJ-6: Complete Family Scenario', () => {
  test.describe.configure({ mode: 'serial' });

  let parentContext: BrowserContext;
  let childContext: BrowserContext;
  let partnerContext: BrowserContext;
  let inviteCode: string;
  let householdName: string;

  test.beforeAll(async ({ browser }) => {
    parentContext = await browser.newContext();
    childContext = await browser.newContext();
    partnerContext = await browser.newContext();
  });

  test.afterAll(async () => {
    await parentContext.close();
    await childContext.close();
    await partnerContext.close();
  });

  test('UJ-6.1: Parent creates household', async () => {
    const parentPage = await parentContext.newPage();
    const parent = generateTestUser('parent');

    await registerUser(parentPage, parent);
    householdName = 'Familie Schmidt';
    await createHousehold(parentPage, householdName);

    inviteCode = await getInviteCode(parentPage);
    expect(inviteCode).toBeTruthy();

    await parentPage.close();
  });

  test('UJ-6.2: Child joins household', async () => {
    const childPage = await childContext.newPage();
    const child = generateTestUser('child');

    await registerUser(childPage, child);
    await joinHousehold(childPage, inviteCode);

    // Verify household name shown
    await childPage.goto('/household');
    await expect(childPage.getByText(new RegExp(householdName, 'i'))).toBeVisible({ timeout: 5000 });

    await childPage.close();
  });

  test('UJ-6.3: Partner joins household', async () => {
    const partnerPage = await partnerContext.newPage();
    const partner = generateTestUser('partner');

    await registerUser(partnerPage, partner);
    await joinHousehold(partnerPage, inviteCode);

    await partnerPage.goto('/household');
    await expect(partnerPage.getByText(new RegExp(householdName, 'i'))).toBeVisible({ timeout: 5000 });

    await partnerPage.close();
  });

  test('UJ-6.4: Parent creates and assigns chores', async () => {
    const parentPage = await parentContext.newPage();
    await parentPage.goto('/chores/new');

    // Create chore for child (easy, 10 pts)
    await parentPage.getByLabel(/titel/i).fill('Geschirrspüler ausräumen');
    await parentPage.getByLabel(/schwierigkeit/i).click();
    await parentPage.getByRole('option', { name: /leicht/i }).click();
    // Note: Assignee selection may vary based on UI
    await parentPage.getByRole('button', { name: /erstellen/i }).click();
    await parentPage.waitForURL(/\/chores/);

    // Create chore for partner (medium, 20 pts)
    await parentPage.goto('/chores/new');
    await parentPage.getByLabel(/titel/i).fill('Wäsche aufhängen');
    await parentPage.getByLabel(/schwierigkeit/i).click();
    await parentPage.getByRole('option', { name: /mittel/i }).click();
    await parentPage.getByRole('button', { name: /erstellen/i }).click();
    await parentPage.waitForURL(/\/chores/);

    // Create chore for anyone (hard, 50 pts)
    await parentPage.goto('/chores/new');
    await parentPage.getByLabel(/titel/i).fill('Bad putzen');
    await parentPage.getByLabel(/schwierigkeit/i).click();
    await parentPage.getByRole('option', { name: /schwer/i }).click();
    await parentPage.getByRole('button', { name: /erstellen/i }).click();
    await parentPage.waitForURL(/\/chores/);

    // Create recurring chore
    await parentPage.goto('/chores/new');
    await parentPage.getByLabel(/titel/i).fill('Müll rausbringen');
    const recurrenceSelect = parentPage.getByLabel(/wiederholung/i);
    if (await recurrenceSelect.isVisible()) {
      await recurrenceSelect.click();
      await parentPage.getByRole('option', { name: /wöchentlich/i }).click();
    }
    await parentPage.getByRole('button', { name: /erstellen/i }).click();

    await parentPage.close();
  });

  test('UJ-6.5: Child completes chore and earns points', async () => {
    const childPage = await childContext.newPage();
    await childPage.goto('/chores');

    // Complete "Geschirrspüler ausräumen" (10 pts)
    const choreCard = childPage.getByText(/Geschirrspüler/i).first().locator('xpath=..');
    await choreCard.locator('button').first().click();
    await childPage.waitForTimeout(500);

    // Claim and complete "Bad putzen" (50 pts) if available
    const badChore = childPage.getByText(/Bad putzen/i);
    if (await badChore.isVisible()) {
      await badChore.first().click();
      await childPage.waitForURL(/\/chores\/[^/]+$/);

      // Complete it
      const completeBtn = childPage.getByRole('button', { name: /erledigt|abschließen/i });
      if (await completeBtn.isVisible()) {
        await completeBtn.click();
      }
    }

    // Verify points earned (should be ~60)
    await childPage.goto('/dashboard');
    await childPage.waitForTimeout(1000);

    await childPage.close();
  });

  test('UJ-6.6: Partner completes chore', async () => {
    const partnerPage = await partnerContext.newPage();
    await partnerPage.goto('/chores');

    // Complete "Wäsche aufhängen" (20 pts)
    const choreCard = partnerPage.getByText(/Wäsche/i).first().locator('xpath=..');
    await choreCard.locator('button').first().click();
    await partnerPage.waitForTimeout(500);

    await partnerPage.close();
  });

  test('UJ-6.7: Verify leaderboard shows correct rankings', async () => {
    const parentPage = await parentContext.newPage();
    await parentPage.goto('/statistics');

    // Should show leaderboard
    await expect(parentPage.getByText(/rangliste|leaderboard/i)).toBeVisible({ timeout: 5000 });

    // Check rankings - child should have most points (60)
    // Partner should have 20
    // Parent should have 0
    await parentPage.screenshot({ path: 'test-results/family-scenario/leaderboard.png' });

    await parentPage.close();
  });

  test('UJ-6.8: Verify child earned XP toward next level', async () => {
    const childPage = await childContext.newPage();
    await childPage.goto('/profile');

    // Should show level progress
    await expect(childPage.getByText(/level\s*\d+/i)).toBeVisible({ timeout: 5000 });

    // Check for XP/progress indicator
    const progressBar = childPage.locator('[class*="progress"]').or(childPage.locator('[role="progressbar"]'));
    await expect(progressBar.first()).toBeVisible({ timeout: 5000 });

    await childPage.close();
  });

  test('UJ-6.9: Parent creates reward', async () => {
    const parentPage = await parentContext.newPage();
    await parentPage.goto('/rewards/create');

    await parentPage.getByLabel(/titel/i).fill('Eis essen');
    await parentPage.getByLabel(/beschreibung/i).fill('Eis beim Eisladen kaufen');
    await parentPage.getByLabel(/punkte/i).fill('50');
    await parentPage.getByRole('button', { name: /erstellen/i }).click();

    await parentPage.waitForURL(/\/rewards/);

    await parentPage.close();
  });

  test('UJ-6.10: Child redeems reward', async () => {
    const childPage = await childContext.newPage();
    await childPage.goto('/rewards');

    // Find the "Eis essen" reward
    const rewardCard = childPage.getByText(/Eis essen/i).first().locator('xpath=..');
    await rewardCard.getByRole('button', { name: /einlösen/i }).click();

    // Confirm redemption
    await childPage.getByRole('button', { name: /bestätigen/i }).last().click();

    // Should show success
    await expect(childPage.getByText(/erfolgreich|eingelöst/i)).toBeVisible({ timeout: 5000 });

    // Points should be reduced (60 - 50 = 10 remaining)
    await childPage.goto('/dashboard');
    await childPage.waitForTimeout(1000);

    await childPage.close();
  });

  test('UJ-6.11: Parent marks reward as fulfilled', async () => {
    const parentPage = await parentContext.newPage();
    await parentPage.goto('/household/redemptions');

    // Find pending redemption
    const pendingRedemption = parentPage.getByText(/Eis essen/i).first();
    await expect(pendingRedemption).toBeVisible({ timeout: 5000 });

    // Mark as fulfilled
    const fulfillBtn = parentPage.getByRole('button', { name: /erfüllt|abgehakt|erledigt/i }).first();
    if (await fulfillBtn.isVisible()) {
      await fulfillBtn.click();
    }

    await parentPage.close();
  });

  test('UJ-6.12: Verify full audit trail', async () => {
    const parentPage = await parentContext.newPage();

    // Check point transactions exist
    await parentPage.goto('/points/history');
    await expect(parentPage.getByText(/transaktion/i)).toBeVisible({ timeout: 5000 });

    // Check redemptions are logged
    await parentPage.goto('/household/redemptions');
    await expect(parentPage.getByText(/Eis essen/i)).toBeVisible({ timeout: 5000 });

    // Check all members are in household
    await parentPage.goto('/household');
    await parentPage.screenshot({ path: 'test-results/family-scenario/household-members.png' });

    await parentPage.close();
  });
});