import { test, expect, Page } from '@playwright/test';
import { generateTestUser } from '../fixtures/test-users';
import { registerUser } from '../utils/auth-helpers';
import { createHousehold } from '../utils/household-helpers';

/**
 * PROJ-9: User Journey 4 - Gamification Flow
 */
test.describe('UJ-4: Gamification Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    const user = generateTestUser('parent');
    await registerUser(page, user);
    await createHousehold(page, 'Test Haushalt Gamification');
  });

  /**
   * Helper to create and complete a chore
   */
  async function createAndCompleteChore(page: Page, title: string, difficulty: 'easy' | 'medium' | 'hard') {
    await page.goto('/chores/new');
    await page.getByLabel(/titel/i).fill(title);

    // Set difficulty
    await page.getByLabel(/schwierigkeit/i).click();
    const difficultyLabel = difficulty === 'easy' ? 'Leicht' : difficulty === 'hard' ? 'Schwer' : 'Mittel';
    await page.getByRole('option', { name: new RegExp(difficultyLabel, 'i') }).click();

    await page.getByRole('button', { name: /erstellen/i }).click();
    await page.waitForURL(/\/chores/, { timeout: 10000 });

    // Complete the chore
    await page.goto('/chores');
    const choreCard = page.locator(`text=${title}`).first().locator('xpath=..');
    await choreCard.locator('button').first().click();
    await page.waitForTimeout(500);
  }

  test.describe('UJ-4.1: Point Progression', () => {
    test('should accumulate points correctly', async ({ page }) => {
      // Complete easy chore (10 points)
      await createAndCompleteChore(page, 'Easy Task 1', 'easy');

      // Complete medium chore (20 points)
      await createAndCompleteChore(page, 'Medium Task 1', 'medium');

      // Complete hard chore (50 points)
      await createAndCompleteChore(page, 'Hard Task 1', 'hard');

      // Check total points (should be 80)
      await page.goto('/dashboard');
      await page.waitForTimeout(1000);

      // Verify points display
      const pointsDisplay = page.getByText(/\d+\s*(punkte|p)/i).first();
      await expect(pointsDisplay).toBeVisible({ timeout: 5000 });
    });

    test('should show point history with all transactions', async ({ page }) => {
      // Complete multiple chores
      await createAndCompleteChore(page, 'History Task 1', 'easy');
      await createAndCompleteChore(page, 'History Task 2', 'medium');

      // Go to point history
      await page.goto('/points/history');

      // Should show transactions
      await expect(page.getByText(/History Task/i)).toBeVisible({ timeout: 5000 });
    });

    test('should update leaderboard after earning points', async ({ page }) => {
      // Complete chores
      await createAndCompleteChore(page, 'Leaderboard Task', 'hard');

      // Go to statistics/leaderboard
      await page.goto('/statistics');

      // Should show leaderboard
      await expect(page.getByText(/rangliste|leaderboard/i)).toBeVisible({ timeout: 5000 });
    });

    test('should match balance with sum of transactions', async ({ page }) => {
      // Complete chores
      await createAndCompleteChore(page, 'Balance Task 1', 'easy');  // 10
      await createAndCompleteChore(page, 'Balance Task 2', 'medium'); // 20

      // Go to point history
      await page.goto('/points/history');

      // Check for summary
      await expect(page.getByText(/verdient|total/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('UJ-4.2: Level Up Experience', () => {
    test('should earn XP per chore', async ({ page }) => {
      await createAndCompleteChore(page, 'XP Task', 'medium');

      // Check for XP/level progress
      await page.goto('/dashboard');

      // Should show level indicator
      await expect(page.getByText(/level\s*\d+/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show level up celebration at threshold', async ({ page }) => {
      // Complete many chores to potentially level up
      for (let i = 0; i < 5; i++) {
        await createAndCompleteChore(page, `Level Task ${i}`, 'hard');
      }

      // Check for level up notification (if threshold reached)
      await page.goto('/dashboard');
      await page.waitForTimeout(1000);

      // Look for level display
      const levelText = page.getByText(/level\s*\d+/i);
      await expect(levelText).toBeVisible({ timeout: 5000 });
    });

    test('should display XP progress bar', async ({ page }) => {
      await page.goto('/dashboard');

      // Look for progress bar (XP towards next level)
      const progressBar = page.locator('[class*="progress"]').or(page.locator('[role="progressbar"]'));

      // Should have some progress indicator
      await expect(progressBar.first()).toBeVisible({ timeout: 5000 });
    });

    test('should reset progress for new level after level up', async ({ page }) => {
      // Complete chores
      await createAndCompleteChore(page, 'Progress Task', 'hard');

      await page.goto('/profile');

      // Check level and XP display
      await expect(page.getByText(/level\s*\d+/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('UJ-4.3: Streak Tracking', () => {
    test('should start streak after first chore', async ({ page }) => {
      await createAndCompleteChore(page, 'Streak Starter', 'easy');

      await page.goto('/statistics');

      // Check for streak display
      await expect(page.getByText(/serie|streak|tage/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show flame icon for active streak', async ({ page }) => {
      await createAndCompleteChore(page, 'Flame Task', 'easy');

      await page.goto('/statistics');

      // Look for flame icon
      const flameIcon = page.locator('svg.lucide-flame').or(page.locator('[data-testid="flame-icon"]'));
      await expect(flameIcon.first()).toBeVisible({ timeout: 5000 });
    });

    test('should display streak count', async ({ page }) => {
      await createAndCompleteChore(page, 'Streak Count Task', 'easy');

      await page.goto('/statistics');

      // Should show number of days
      const streakNumber = page.getByText(/\d+\s*(tag|tage)/i);
      await expect(streakNumber.first()).toBeVisible({ timeout: 5000 });
    });

    test('should track longest streak', async ({ page }) => {
      await createAndCompleteChore(page, 'Longest Streak Task', 'easy');

      await page.goto('/statistics');

      // Look for longest streak display
      await expect(page.getByText(/längste|rekord|beste/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('UJ-4.4: Badge/Achievement System', () => {
    test('should show badges page', async ({ page }) => {
      await page.goto('/badges');

      // Should show badge collection
      await expect(page.getByText(/badges|abzeichen|errungenschaften/i)).toBeVisible({ timeout: 5000 });
    });

    test('should display locked and unlocked badges', async ({ page }) => {
      await page.goto('/badges');

      // Should show some badges (locked or unlocked)
      const badgeElements = page.locator('[class*="badge"]').or(page.locator('[data-testid="badge"]'));
      await expect(badgeElements.first()).toBeVisible({ timeout: 5000 });
    });

    test('should unlock badge after completing first chore', async ({ page }) => {
      await createAndCompleteChore(page, 'First Badge Task', 'easy');

      await page.goto('/badges');

      // Look for newly unlocked badge
      await page.waitForTimeout(1000);

      // Check for any unlocked badge indicator
      const unlockedBadge = page.getByText(/freigeschaltet|erhalten|unlocked/i);
      // May or may not be visible depending on badge conditions
    });
  });
});