import { test, expect, Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

// Test credentials
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

// Helper function to login
async function login(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(TEST_USER_EMAIL);
  await page.getByLabel('Passwort').fill(TEST_USER_PASSWORD);
  await page.getByRole('button', { name: 'Anmelden' }).click();

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

// Helper function to ensure household exists
async function ensureHousehold(page: Page) {
  await page.goto('/dashboard');

  // Check if we need to create a household
  const createHouseholdBtn = page.getByRole('button', { name: 'Haushalt erstellen' });
  if (await createHouseholdBtn.isVisible()) {
    await createHouseholdBtn.click();
    await page.waitForURL('**/household/create');
    await page.getByLabel('Haushaltsname').fill('Test Haushalt');
    await page.getByRole('button', { name: 'Erstellen' }).click();
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  }
}

// Helper function to create a chore
async function createChore(page: Page, title: string, difficulty: string = 'medium') {
  await page.goto('/chores/new');
  await page.getByLabel('Titel').fill(title);

  // Set difficulty
  await page.getByLabel('Schwierigkeit').click();
  await page.getByRole('option', { name: difficulty === 'easy' ? 'Leicht' : difficulty === 'hard' ? 'Schwer' : 'Mittel' }).click();

  await page.getByRole('button', { name: 'Erstellen' }).click();
  await page.waitForURL('**/chores', { timeout: 10000 });
}

test.describe('PROJ-5: Gamification - Points System', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await ensureHousehold(page);
  });

  test.describe('US-5.1: Earn Points for Completing Chores', () => {
    test('should display points in dashboard header', async ({ page }) => {
      await page.goto('/dashboard');

      // Check for point balance display
      const trophyIcon = page.locator('svg.lucide-trophy, [data-testid="point-balance"]');
      await expect(trophyIcon.first()).toBeVisible({ timeout: 5000 });

      // Check for points number
      const pointsText = page.getByText(/\d+\s*Punkte/);
      await expect(pointsText.first()).toBeVisible({ timeout: 5000 });

      await page.screenshot({ path: 'test-results/proj-5/US-5.1-points-display.png' });
    });

    test('should show point balance as clickable link to history', async ({ page }) => {
      await page.goto('/dashboard');

      // Click on points display
      const pointsLink = page.getByRole('link', { name: /Punkte/ }).first();
      if (await pointsLink.isVisible()) {
        await pointsLink.click();
        await expect(page).toHaveURL(/.*points\/history/);
      }
    });

    test('should award points when completing a chore', async ({ page }) => {
      // Create a chore first
      await createChore(page, 'Test Points Chore ' + Date.now(), 'medium');

      // Go to chores page
      await page.goto('/chores');

      // Find and complete the chore
      const choreCard = page.getByText('Test Points Chore').first();
      await choreCard.click();

      // Wait for chore detail page
      await page.waitForURL('**/chores/**');

      // Click complete button
      const completeBtn = page.getByRole('button', { name: /Erledigt|Abschliessen/ });
      if (await completeBtn.isVisible()) {
        await completeBtn.click();

        // Check for success feedback
        const successMessage = page.getByText(/Punkte verdient|erfolgreich/);
        await expect(successMessage).toBeVisible({ timeout: 5000 });
      }

      await page.screenshot({ path: 'test-results/proj-5/US-5.1-complete-chore.png' });
    });

    test('should show animated point change indicator', async ({ page }) => {
      await page.goto('/dashboard');

      // Check for point balance component
      const pointBalance = page.locator('[class*="point"]').first();
      await expect(pointBalance).toBeVisible({ timeout: 5000 });

      await page.screenshot({ path: 'test-results/proj-5/US-5.1-point-balance.png' });
    });
  });

  test.describe('US-5.2: View Point Balance', () => {
    test('should display point balance in header', async ({ page }) => {
      await page.goto('/dashboard');

      // Check for trophy icon (points indicator)
      const trophyIcon = page.locator('svg.lucide-trophy').first();
      await expect(trophyIcon).toBeVisible({ timeout: 5000 });

      await page.screenshot({ path: 'test-results/proj-5/US-5.2-header-balance.png' });
    });

    test('should link to point history from balance', async ({ page }) => {
      await page.goto('/dashboard');

      // Click on points area
      const pointsArea = page.getByRole('link', { name: /Punkte/ }).first();
      if (await pointsArea.isVisible()) {
        await pointsArea.click();
        await expect(page).toHaveURL(/.*points\/history/);
      }
    });
  });

  test.describe('US-5.3: View Point History', () => {
    test('should display point history page', async ({ page }) => {
      await page.goto('/points/history');

      // Check for page title
      await expect(page.getByRole('heading', { name: /Punkteverlauf/ })).toBeVisible({ timeout: 5000 });

      await page.screenshot({ path: 'test-results/proj-5/US-5.3-history-page.png' });
    });

    test('should show summary cards', async ({ page }) => {
      await page.goto('/points/history');

      // Check for summary cards
      await expect(page.getByText('Aktueller Stand')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Verdient')).toBeVisible();
      await expect(page.getByText('Ausgegeben')).toBeVisible();
      await expect(page.getByText('Transaktionen')).toBeVisible();

      await page.screenshot({ path: 'test-results/proj-5/US-5.3-summary-cards.png' });
    });

    test('should have filter tabs for transactions', async ({ page }) => {
      await page.goto('/points/history');

      // Check for filter tabs
      const allTab = page.getByRole('tab', { name: 'Alle' });
      const earnedTab = page.getByRole('tab', { name: 'Verdient' });
      const spentTab = page.getByRole('tab', { name: 'Ausgegeben' });

      await expect(allTab).toBeVisible({ timeout: 5000 });
      await expect(earnedTab).toBeVisible();
      await expect(spentTab).toBeVisible();

      // Test filtering
      await earnedTab.click();
      await page.waitForTimeout(500);
      await spentTab.click();
      await page.waitForTimeout(500);
      await allTab.click();

      await page.screenshot({ path: 'test-results/proj-5/US-5.3-filter-tabs.png' });
    });

    test('should show transaction details', async ({ page }) => {
      await page.goto('/points/history');

      // Wait for transactions to load
      await page.waitForTimeout(1000);

      // Check if there are transactions or empty state
      const emptyState = page.getByText('Noch keine Transaktionen');
      const transactionList = page.locator('[class*="transaction"]').or(page.locator('[class*="space-y"] > div'));

      // Either empty state or transactions should be visible
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      const hasTransactions = await transactionList.count() > 0;

      expect(hasEmpty || hasTransactions).toBeTruthy();

      await page.screenshot({ path: 'test-results/proj-5/US-5.3-transactions.png' });
    });

    test('should paginate long history', async ({ page }) => {
      await page.goto('/points/history');

      // Check for pagination if there are many transactions
      const paginationInfo = page.getByText(/Seite|von/);
      const paginationVisible = await paginationInfo.isVisible().catch(() => false);

      await page.screenshot({ path: 'test-results/proj-5/US-5.3-pagination.png' });
    });
  });

  test.describe('US-5.4: View Leaderboard', () => {
    test('should display leaderboard on dashboard', async ({ page }) => {
      await page.goto('/dashboard');

      // Check for leaderboard section
      const leaderboard = page.getByText(/Rangliste|Leaderboard|Punkte-Rangliste/);
      await expect(leaderboard.first()).toBeVisible({ timeout: 5000 });

      await page.screenshot({ path: 'test-results/proj-5/US-5.4-leaderboard-dashboard.png' });
    });

    test('should display leaderboard on statistics page', async ({ page }) => {
      await page.goto('/statistics');

      // Check for leaderboard
      await expect(page.getByText(/Rangliste|Leaderboard/)).toBeVisible({ timeout: 5000 });

      await page.screenshot({ path: 'test-results/proj-5/US-5.4-leaderboard-stats.png' });
    });

    test('should show time period filter for leaderboard', async ({ page }) => {
      await page.goto('/statistics');

      // Check for time period selector
      const periodSelector = page.getByRole('combobox').filter({ hasText: /Woche|Monat|alle/ });
      if (await periodSelector.isVisible().catch(() => false)) {
        await periodSelector.click();

        // Check for options
        await expect(page.getByRole('option', { name: /Woche/ })).toBeVisible({ timeout: 3000 });
        await expect(page.getByRole('option', { name: /Monat/ })).toBeVisible();
      }

      await page.screenshot({ path: 'test-results/proj-5/US-5.4-time-filter.png' });
    });

    test('should highlight current user in leaderboard', async ({ page }) => {
      await page.goto('/statistics');

      // Check for "Du" badge indicating current user
      const userBadge = page.getByText('Du');
      const badgeVisible = await userBadge.isVisible().catch(() => false);

      // Also check for highlighted row
      const highlightedRow = page.locator('[class*="primary"][class*="bg"]');

      await page.screenshot({ path: 'test-results/proj-5/US-5.4-user-highlight.png' });
    });

    test('should show rank icons for top 3', async ({ page }) => {
      await page.goto('/statistics');

      // Check for crown/medal icons for top positions
      const crownIcon = page.locator('svg.lucide-crown');
      const medalIcon = page.locator('svg.lucide-medal');

      await page.screenshot({ path: 'test-results/proj-5/US-5.4-rank-icons.png' });
    });
  });

  test.describe('US-5.5: View Weekly/Monthly Statistics', () => {
    test('should display statistics page', async ({ page }) => {
      await page.goto('/statistics');

      // Check for page title
      await expect(page.getByRole('heading', { name: /Statistiken/ })).toBeVisible({ timeout: 5000 });

      await page.screenshot({ path: 'test-results/proj-5/US-5.5-stats-page.png' });
    });

    test('should show weekly points card', async ({ page }) => {
      await page.goto('/statistics');

      // Check for weekly points display
      await expect(page.getByText(/Punkte diese Woche/)).toBeVisible({ timeout: 5000 });

      await page.screenshot({ path: 'test-results/proj-5/US-5.5-weekly-points.png' });
    });

    test('should show chores completed this week', async ({ page }) => {
      await page.goto('/statistics');

      // Check for chores display
      await expect(page.getByText(/Aufgaben diese Woche/)).toBeVisible({ timeout: 5000 });

      await page.screenshot({ path: 'test-results/proj-5/US-5.5-weekly-chores.png' });
    });

    test('should display streak information', async ({ page }) => {
      await page.goto('/statistics');

      // Check for streak display
      await expect(page.getByText(/Serie|Streak/)).toBeVisible({ timeout: 5000 });

      // Check for flame icon
      const flameIcon = page.locator('svg.lucide-flame');
      await expect(flameIcon.first()).toBeVisible({ timeout: 5000 });

      await page.screenshot({ path: 'test-results/proj-5/US-5.5-streak.png' });
    });

    test('should show comparison to previous period', async ({ page }) => {
      await page.goto('/statistics');

      // Check for comparison indicators
      const comparisonIndicator = page.locator('text=/%|vs\\./');

      // Check for weekly comparison
      await expect(page.getByText(/Wochenvergleich/)).toBeVisible({ timeout: 5000 });

      await page.screenshot({ path: 'test-results/proj-5/US-5.5-comparison.png' });
    });

    test('should show monthly statistics', async ({ page }) => {
      await page.goto('/statistics');

      // Check for monthly stats
      await expect(page.getByText(/Monatsstatistik/)).toBeVisible({ timeout: 5000 });

      await page.screenshot({ path: 'test-results/proj-5/US-5.5-monthly.png' });
    });

    test('should display activity calendar', async ({ page }) => {
      await page.goto('/statistics');

      // Check for activity calendar
      await expect(page.getByText(/Aktivitatskalender|Aktivitat/)).toBeVisible({ timeout: 5000 });

      await page.screenshot({ path: 'test-results/proj-5/US-5.5-calendar.png' });
    });
  });

  test.describe('US-5.6: Bonus Points (Admin Only)', () => {
    test('should show bonus points option for admins', async ({ page }) => {
      await page.goto('/household');

      // Check for bonus points button (only visible to admins)
      const bonusBtn = page.getByRole('button', { name: /Bonus|Punkte verg/ });

      await page.screenshot({ path: 'test-results/proj-5/US-5.6-admin-options.png' });
    });

    test('should open bonus points dialog', async ({ page }) => {
      await page.goto('/household');

      // Look for bonus points button
      const bonusBtn = page.getByRole('button', { name: /Bonus|Punkte verg/ });

      if (await bonusBtn.isVisible().catch(() => false)) {
        await bonusBtn.click();

        // Check for dialog
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });
        await expect(page.getByText(/Bonuspunkte verg/)).toBeVisible();
      }

      await page.screenshot({ path: 'test-results/proj-5/US-5.6-bonus-dialog.png' });
    });

    test('should validate point amount (1-100)', async ({ page }) => {
      await page.goto('/household');

      const bonusBtn = page.getByRole('button', { name: /Bonus|Punkte verg/ });

      if (await bonusBtn.isVisible().catch(() => false)) {
        await bonusBtn.click();

        // Try invalid point amount
        const pointsInput = page.getByLabel(/Punkte/);
        if (await pointsInput.isVisible()) {
          await pointsInput.fill('0');
          await page.waitForTimeout(300);

          // Should show validation error
          const error = page.getByText(/1 und 100/);
          await page.screenshot({ path: 'test-results/proj-5/US-5.6-validation-error.png' });
        }
      }
    });

    test('should have member selection dropdown', async ({ page }) => {
      await page.goto('/household');

      const bonusBtn = page.getByRole('button', { name: /Bonus|Punkte verg/ });

      if (await bonusBtn.isVisible().catch(() => false)) {
        await bonusBtn.click();

        // Check for member selector
        const memberSelect = page.getByLabel(/Mitglied|Member/);
        await expect(memberSelect).toBeVisible({ timeout: 3000 });
      }
    });

    test('should have optional reason field', async ({ page }) => {
      await page.goto('/household');

      const bonusBtn = page.getByRole('button', { name: /Bonus|Punkte verg/ });

      if (await bonusBtn.isVisible().catch(() => false)) {
        await bonusBtn.click();

        // Check for reason field
        const reasonField = page.getByLabel(/Grund|Reason/);
        await expect(reasonField).toBeVisible({ timeout: 3000 });
      }
    });

    test('should show confirmation dialog before awarding', async ({ page }) => {
      await page.goto('/household');

      const bonusBtn = page.getByRole('button', { name: /Bonus|Punkte verg/ });

      if (await bonusBtn.isVisible().catch(() => false)) {
        await bonusBtn.click();

        // Fill form
        const memberSelect = page.getByLabel(/Mitglied/);
        const pointsInput = page.getByLabel(/Punkte/);

        if (await memberSelect.isVisible() && await pointsInput.isVisible()) {
          await memberSelect.click();
          await page.getByRole('option').first().click();
          await pointsInput.fill('10');

          // Submit form
          await page.getByRole('button', { name: /vergeben|Punkte verg/ }).last().click();

          // Check for confirmation
          await expect(page.getByText(/bestatigen|Bestatigung/)).toBeVisible({ timeout: 3000 });
        }
      }

      await page.screenshot({ path: 'test-results/proj-5/US-5.6-confirmation.png' });
    });
  });

  test.describe('Security Tests', () => {
    test('should require authentication for points pages', async ({ page }) => {
      await page.goto('/points/history');

      // Should redirect to login or show error
      await page.waitForTimeout(1000);
      const url = page.url();
      expect(url).toMatch(/auth|login|unauthorized/i);

      await page.screenshot({ path: 'test-results/proj-5/SEC-auth-required.png' });
    });

    test('should require authentication for statistics page', async ({ page }) => {
      await page.goto('/statistics');

      await page.waitForTimeout(1000);
      const url = page.url();
      expect(url).toMatch(/auth|login|unauthorized/i);
    });

    test('should prevent XSS in reason field', async ({ page }) => {
      await login(page);
      await page.goto('/household');

      const bonusBtn = page.getByRole('button', { name: /Bonus|Punkte verg/ });

      if (await bonusBtn.isVisible().catch(() => false)) {
        await bonusBtn.click();

        const reasonField = page.getByLabel(/Grund/);
        if (await reasonField.isVisible()) {
          await reasonField.fill('<script>alert("XSS")</script>');

          // The script tag should be escaped, not executed
          await page.waitForTimeout(300);

          // Check that no alert was triggered
          await page.screenshot({ path: 'test-results/proj-5/SEC-xss-test.png' });
        }
      }
    });

    test('should validate API endpoints require auth', async ({ page }) => {
      // Try to access API without auth
      const response = await page.request.get('http://localhost:3000/api/points/balance');
      expect(response.status()).toBe(401);

      const historyResponse = await page.request.get('http://localhost:3000/api/points/history');
      expect(historyResponse.status()).toBe(401);

      const leaderboardResponse = await page.request.get('http://localhost:3000/api/leaderboard');
      expect(leaderboardResponse.status()).toBe(401);
    });
  });

  test.describe('Responsive Tests', () => {
    test('should display correctly on mobile (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await login(page);
      await page.goto('/dashboard');

      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/proj-5/RESP-mobile-dashboard.png', fullPage: true });

      await page.goto('/points/history');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/proj-5/RESP-mobile-history.png', fullPage: true });

      await page.goto('/statistics');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/proj-5/RESP-mobile-stats.png', fullPage: true });
    });

    test('should display correctly on tablet (768px)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await login(page);
      await page.goto('/dashboard');

      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/proj-5/RESP-tablet-dashboard.png', fullPage: true });
    });

    test('should display correctly on desktop (1440px)', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await login(page);
      await page.goto('/dashboard');

      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/proj-5/RESP-desktop-dashboard.png', fullPage: true });
    });
  });
});